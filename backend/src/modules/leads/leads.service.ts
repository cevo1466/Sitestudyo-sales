import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../crm-shared/activity.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import type { ListLeadQuery, PromoteDto } from './lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivityService,
    private readonly pipelines: PipelinesService,
  ) {}

  /**
   * TERFI: havuzdaki bir isletmeyi satis hunisine alir.
   *
   * @param tx Toplu terfide cagiran zaten bir transaction icinde olabilir.
   */
  async promote(dto: PromoteDto, userId: string, tx?: Prisma.TransactionClient) {
    const run = async (client: Prisma.TransactionClient) => {
      const company = await client.company.findUnique({ where: { id: dto.companyId } });
      if (!company) {
        throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
      }

      // Ayni anda EN FAZLA bir acik is kaydi. Kapali kayit varken yenisi
      // acilabilir — tekrar satis (site -> bakim -> yenileme) tam olarak budur.
      const open = await client.lead.findFirst({
        where: { companyId: dto.companyId, closedAt: null },
      });
      if (open) {
        throw new ConflictException({
          code: 'lead_already_open',
          message: 'Bu isletmenin zaten acik bir is kaydi var',
        });
      }

      const pipeline = dto.pipelineId
        ? await client.pipeline.findUnique({
            where: { id: dto.pipelineId },
            include: { stages: { orderBy: { sortOrder: 'asc' } } },
          })
        : await this.pipelines.getDefault();

      if (!pipeline || !pipeline.stages.length) {
        throw new BadRequestException({
          code: 'pipeline_has_no_stages',
          message: 'Secilen huninin hic asamasi yok',
        });
      }

      const lead = await client.lead.create({
        data: {
          companyId: dto.companyId,
          pipelineId: pipeline.id,
          stageId: pipeline.stages[0].id,
          title: dto.title,
          value: dto.value ?? null,
          currency: dto.currency,
          ownerId: userId,
          stageEnteredAt: new Date(),
        },
      });

      // AYNI transaction: lead yazilip aktivite yazilmazsa "bu is huniye ne
      // zaman girdi" sorusunun cevabi kaybolur.
      await this.activities.record(
        {
          type: ActivityType.SYSTEM,
          companyId: dto.companyId,
          leadId: lead.id,
          userId,
          subject: 'Huniye alindi',
          meta: { pipeline: pipeline.name, stage: pipeline.stages[0].key },
        },
        client,
      );

      return lead;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async list(q: ListLeadQuery) {
    const where: Prisma.LeadWhereInput = {
      ...(q.stageId ? { stageId: q.stageId } : {}),
      ...(q.companyId ? { companyId: q.companyId } : {}),
      ...(q.status === 'open' ? { closedAt: null } : {}),
      ...(q.status === 'closed' ? { closedAt: { not: null } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, city: true, leadGrade: true } },
          stage: true,
        },
        orderBy: { stageEnteredAt: 'desc' },
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total };
  }

  async update(id: string, dto: { title?: string; value?: number | null }) {
    await this.getOpenOrThrow(id);
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async move(id: string, stageId: string, note: string | undefined, userId: string) {
    const lead = await this.getOpenOrThrow(id);

    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage || stage.pipelineId !== lead.pipelineId) {
      // Baska huninin asamasina tasinsa is kaydi kendi hunisinde kaybolur.
      throw new BadRequestException({
        code: 'stage_not_in_pipeline',
        message: 'Secilen asama bu isin hunisine ait degil',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          stageId,
          // Her geciste sifirlanir: bir isin bir asamada NE KADAR bekledigini
          // olcebilmek icin. Toplam yasi createdAt veriyor.
          stageEnteredAt: new Date(),
          ...(stage.isWon || stage.isLost ? { closedAt: new Date() } : {}),
        },
      });

      await this.activities.record(
        {
          type: ActivityType.STAGE_CHANGE,
          companyId: lead.companyId,
          leadId: lead.id,
          userId,
          subject: `${lead.stage.name} -> ${stage.name}`,
          body: note ?? null,
          meta: { from: lead.stage.key, to: stage.key },
        },
        tx,
      );

      return updated;
    });
  }

  async close(id: string, won: boolean, lostReason: string | undefined, userId: string) {
    const lead = await this.getOpenOrThrow(id);

    const target = await this.prisma.pipelineStage.findFirst({
      where: { pipelineId: lead.pipelineId, ...(won ? { isWon: true } : { isLost: true }) },
    });
    if (!target) {
      throw new BadRequestException({
        code: 'no_close_stage',
        message: `Bu hunide ${won ? 'kazanildi' : 'kaybedildi'} asamasi tanimli degil`,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          stageId: target.id,
          stageEnteredAt: new Date(),
          closedAt: new Date(),
          lostReason: won ? null : (lostReason ?? null),
        },
      });

      await this.activities.record(
        {
          type: ActivityType.STAGE_CHANGE,
          companyId: lead.companyId,
          leadId: lead.id,
          userId,
          subject: won ? 'Kazanildi' : 'Kaybedildi',
          body: lostReason ?? null,
          meta: { from: lead.stage.key, to: target.key, closed: true },
        },
        tx,
      );

      return updated;
    });
  }

  private async getOpenOrThrow(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { stage: true } });
    if (!lead) throw new NotFoundException({ code: 'not_found', message: 'Is kaydi bulunamadi' });
    if (lead.closedAt) {
      // Kapali bir isi tasimak gecmisi bozar; yeni is icin yeni kayit acilir.
      throw new ConflictException({
        code: 'lead_closed',
        message: 'Bu is kapatilmis. Yeni bir is icin isletmeyi tekrar huniye alin.',
      });
    }
    return lead;
  }
}
