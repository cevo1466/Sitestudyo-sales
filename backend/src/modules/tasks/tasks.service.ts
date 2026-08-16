import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../crm-shared/activity.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivityService,
  ) {}

  create(
    userId: string,
    dto: { companyId?: string; leadId?: string; title: string; notes?: string; dueAt: Date },
  ) {
    return this.prisma.task.create({
      data: {
        userId,
        companyId: dto.companyId ?? null,
        leadId: dto.leadId ?? null,
        title: dto.title,
        notes: dto.notes ?? null,
        dueAt: dto.dueAt,
      },
    });
  }

  /**
   * "Bugun ne yapmaliyim" listesi.
   *
   * Gecmis tarihli acik gorevler de DAHIL: bir gorevin tarihi gectigi
   * icin listeden dusmesi, unutulmasinin en hizli yolu olurdu.
   */
  async agenda(userId: string, days = 0) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() + days);

    const tasks = await this.prisma.task.findMany({
      where: { userId, status: TaskStatus.OPEN, dueAt: { lte: end } },
      include: { company: { select: { id: true, name: true, phone: true, city: true } } },
      orderBy: { dueAt: 'asc' },
      take: 200,
    });

    const now = new Date();
    return {
      overdue: tasks.filter((t) => t.dueAt < now).length,
      items: tasks.map((t) => ({ ...t, isOverdue: t.dueAt < now })),
    };
  }

  list(userId: string, filter: { companyId?: string; status?: TaskStatus }) {
    const where: Prisma.TaskWhereInput = {
      userId,
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
    return this.prisma.task.findMany({ where, orderBy: { dueAt: 'asc' }, take: 200 });
  }

  async complete(userId: string, id: string) {
    const task = await this.getOwn(userId, id);
    const done = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE, completedAt: new Date() },
    });

    // Tamamlanan gorev zaman tuneline dusuyor: "ne zaman aradik" sorusunun
    // cevabi gorev listesinde degil, isletmenin gecmisinde aranir.
    if (task.companyId) {
      await this.activities.record({
        type: 'SYSTEM',
        companyId: task.companyId,
        leadId: task.leadId,
        userId,
        subject: `Görev tamamlandı: ${task.title}`,
      });
    }
    return done;
  }

  async snooze(userId: string, id: string, dueAt: Date) {
    await this.getOwn(userId, id);
    return this.prisma.task.update({ where: { id }, data: { dueAt } });
  }

  async cancel(userId: string, id: string) {
    await this.getOwn(userId, id);
    return this.prisma.task.update({ where: { id }, data: { status: TaskStatus.CANCELLED } });
  }

  private async getOwn(userId: string, id: string) {
    // userId de where icinde: baskasinin gorevine dokunmaya calisan
    // "var ama senin degil" bilgisini bile alamaz.
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException({ code: 'not_found', message: 'Görev bulunamadı' });
    return task;
  }
}
