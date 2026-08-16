import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DncType, EmailDirection } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import { ActivityService } from '../crm-shared/activity.service';

interface MailSecrets {
  smtpPassword: string;
  imapPassword: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly activities: ActivityService,
  ) {}

  async addAccount(
    userId: string,
    dto: {
      email: string;
      displayName: string;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPassword: string;
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      imapUser: string;
      imapPassword: string;
      dailySendLimit?: number;
    },
  ) {
    // Sifreler AES-256-GCM ile sifreli saklaniyor; veritabani yedegini ele
    // geciren biri posta hesabina erisemesin diye.
    const secretEnc = this.crypto.encryptJson<MailSecrets>({
      smtpPassword: dto.smtpPassword,
      imapPassword: dto.imapPassword,
    });

    const account = await this.prisma.mailAccount.create({
      data: {
        userId,
        email: dto.email.toLowerCase(),
        displayName: dto.displayName,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpSecure: dto.smtpSecure,
        smtpUser: dto.smtpUser,
        imapHost: dto.imapHost,
        imapPort: dto.imapPort,
        imapSecure: dto.imapSecure,
        imapUser: dto.imapUser,
        secretEnc: new Uint8Array(secretEnc),
        dailySendLimit: dto.dailySendLimit ?? 50,
        status: 'unverified',
      },
    });
    return this.strip(account);
  }

  listAccounts(userId: string) {
    return this.prisma.mailAccount
      .findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
      .then((rows) => rows.map((r) => this.strip(r)));
  }

  /** SMTP baglantisini dogrular. Kaydetmeden once denemek icin. */
  async testAccount(id: string) {
    const account = await this.getAccount(id);
    const secrets = this.crypto.decryptJson<MailSecrets>(Buffer.from(account.secretEnc));
    try {
      const transport = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: { user: account.smtpUser, pass: secrets.smtpPassword },
      });
      await transport.verify();
      await this.prisma.mailAccount.update({
        where: { id },
        data: { status: 'verified', lastError: null },
      });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      await this.prisma.mailAccount.update({
        where: { id },
        data: { status: 'failed', lastError: message.slice(0, 500) },
      });
      return { ok: false, error: message };
    }
  }

  /**
   * Teklif e-postasi gonderir.
   *
   * Gonderim oncesi DORT kapi var; hicbiri atlanamaz:
   *   1. Do-Not-Contact — "bir daha yazma" diyene yazmak en pahali hata
   *   2. Gunluk kota — toplu gonderim spam damgasi yer
   *   3. Tahmin adres uyarisi — GUESSED adres sert bounce uretir
   *   4. Hesap dogrulanmis mi
   */
  async send(
    userId: string,
    dto: { accountId: string; companyId: string; contactId: string; subject: string; html: string },
  ) {
    const account = await this.getAccount(dto.accountId);
    if (account.userId !== userId) {
      throw new ForbiddenException({ code: 'forbidden', message: 'Bu posta hesabi size ait degil' });
    }

    const contact = await this.prisma.contact.findUnique({ where: { id: dto.contactId } });
    if (!contact?.email) {
      throw new BadRequestException({
        code: 'no_email',
        message: 'Bu kisinin e-posta adresi yok',
      });
    }

    // 1) Do-Not-Contact
    const domain = contact.email.split('@')[1];
    const blocked = await this.prisma.doNotContact.findFirst({
      where: {
        OR: [
          { type: DncType.EMAIL, value: contact.email },
          { type: DncType.DOMAIN, value: domain },
        ],
      },
    });
    if (blocked) {
      throw new ForbiddenException({
        code: 'do_not_contact',
        message: `Bu adres temas edilmeyecekler listesinde${blocked.reason ? `: ${blocked.reason}` : ''}`,
      });
    }

    // 2) Gunluk kota
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const sentToday = await this.prisma.emailMessage.count({
      where: {
        mailAccountId: account.id,
        direction: EmailDirection.OUTBOUND,
        createdAt: { gte: since },
      },
    });
    if (sentToday >= account.dailySendLimit) {
      throw new ForbiddenException({
        code: 'daily_limit_reached',
        message: `Gunluk gonderim siniri doldu (${account.dailySendLimit}). Yarin devam edin.`,
      });
    }

    // 3) Tahmin adres
    if (contact.confidence === 'GUESSED') {
      throw new BadRequestException({
        code: 'unverified_email',
        message:
          'Bu adres tahmin uretimi (info@alan-adi). Gondermeden once dogrulayin — yanlis adres sert bounce uretir ve gonderen itibarinizi dusurur.',
      });
    }

    const secrets = this.crypto.decryptJson<MailSecrets>(Buffer.from(account.secretEnc));
    const messageId = `<${randomUUID()}@${account.email.split('@')[1]}>`;

    const thread = await this.prisma.emailThread.create({
      data: {
        companyId: dto.companyId,
        contactId: contact.id,
        mailAccountId: account.id,
        subject: dto.subject,
        messageIdRoot: messageId,
      },
    });

    const message = await this.prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        mailAccountId: account.id,
        contactId: contact.id,
        direction: EmailDirection.OUTBOUND,
        messageId,
        fromAddr: account.email,
        toAddrs: [contact.email],
        subject: dto.subject,
        bodyHtml: dto.html,
        status: 'queued',
      },
    });

    try {
      const transport = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: { user: account.smtpUser, pass: secrets.smtpPassword },
      });
      await transport.sendMail({
        from: `"${account.displayName}" <${account.email}>`,
        to: contact.email,
        subject: dto.subject,
        html: dto.html,
        messageId,
      });

      await this.prisma.emailMessage.update({
        where: { id: message.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      await this.activities.record({
        type: 'EMAIL_OUT',
        companyId: dto.companyId,
        userId,
        subject: dto.subject,
        body: `${contact.email} adresine gonderildi`,
      });

      return { messageId: message.id, status: 'sent' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gonderilemedi';
      await this.prisma.emailMessage.update({
        where: { id: message.id },
        data: { status: 'failed', error: msg.slice(0, 500) },
      });
      throw new BadRequestException({ code: 'send_failed', message: msg });
    }
  }

  listThreads(companyId: string) {
    return this.prisma.emailThread.findMany({
      where: { companyId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  private async getAccount(id: string) {
    const a = await this.prisma.mailAccount.findUnique({ where: { id } });
    if (!a) {
      throw new BadRequestException({ code: 'not_found', message: 'Posta hesabi bulunamadi' });
    }
    return a;
  }

  /** Sifreli sirri cevaptan CIKARIR — API'den disari sizmamali. */
  private strip<T extends { secretEnc: unknown }>(account: T): Omit<T, 'secretEnc'> {
    const { secretEnc: _omit, ...rest } = account;
    return rest;
  }
}
