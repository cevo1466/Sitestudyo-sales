import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { StageInput } from './pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.pipeline.findMany({
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getDefault() {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!pipeline) {
      // Seed calistirilmamis demektir; sessizce bos donmek yerine soyluyoruz.
      throw new NotFoundException({
        code: 'no_default_pipeline',
        message: 'Varsayilan huni bulunamadi. `npm run seed` calistirilmis mi?',
      });
    }
    return pipeline;
  }

  create(dto: { name: string }) {
    // isDefault verilmiyor: varsayilan huni seed ile bir kez kurulur ve
    // sonradan degismez. Iki varsayilan huni olsaydi terfi hangisine
    // yazacagini bilemezdi.
    return this.prisma.pipeline.create({ data: { name: dto.name, isDefault: false } });
  }

  async replaceStages(pipelineId: string, stages: StageInput[]) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { stages: true },
    });
    if (!pipeline) {
      throw new NotFoundException({ code: 'not_found', message: 'Huni bulunamadi' });
    }

    const keepKeys = new Set(stages.map((s) => s.key));
    const removed = pipeline.stages.filter((s) => !keepKeys.has(s.key));

    if (removed.length) {
      const inUse = await this.prisma.lead.count({
        where: { stageId: { in: removed.map((s) => s.id) } },
      });
      if (inUse > 0) {
        // Silinseydi lead sahipsiz kalir ve hunide hicbir sutunda gorunmezdi
        // — kullanici acisindan kaybolmus olurdu.
        throw new ConflictException({
          code: 'stage_in_use',
          message: `Silinmek istenen asamalarda ${inUse} adet is kaydi var. Once onlari tasiyin.`,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (removed.length) {
        await tx.pipelineStage.deleteMany({ where: { id: { in: removed.map((s) => s.id) } } });
      }
      for (const s of stages) {
        await tx.pipelineStage.upsert({
          where: { pipelineId_key: { pipelineId, key: s.key } },
          update: {
            name: s.name,
            sortOrder: s.sortOrder,
            isWon: s.isWon,
            isLost: s.isLost,
            color: s.color ?? null,
          },
          create: { pipelineId, ...s, color: s.color ?? null },
        });
      }
      return tx.pipelineStage.findMany({ where: { pipelineId }, orderBy: { sortOrder: 'asc' } });
    });
  }
}
