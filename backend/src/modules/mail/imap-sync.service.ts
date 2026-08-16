import { Injectable, Logger } from '@nestjs/common';
import { EmailDirection } from '@prisma/client';
import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import { ActivityService } from '../crm-shared/activity.service';

@Injectable()
export class ImapSyncService {
  private readonly logger = new Logger(ImapSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly activities: ActivityService,
  ) {}

  /**
   * Gelen cevaplari ceker ve ilgili is kaydinin zaman tuneline baglar.
   *
   * Eslestirme RFC5322 In-Reply-To/References uzerinden: konu satirina
   * bakmak "Re: Re: Fwd:" zincirlerinde ve ayni konuyla yazan farkli
   * kisilerde yanlis eslesme uretir.
   *
   * lastSyncUid ile kaldigi yerden devam ediyor; her calismada butun
   * kutuyu bastan okumak buyuk kutularda dakikalar surerdi.
   */
  async sync(accountId: string): Promise<{ fetched: number; matched: number }> {
    const account = await this.prisma.mailAccount.findUnique({ where: { id: accountId } });
    if (!account) return { fetched: 0, matched: 0 };

    const secrets = this.crypto.decryptJson<{ imapPassword: string }>(
      Buffer.from(account.secretEnc),
    );

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: { user: account.imapUser, pass: secrets.imapPassword },
      logger: false,
    });

    let fetched = 0;
    let matched = 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        const since = account.lastSyncUid ?? 1;
        for await (const msg of client.fetch(
          { uid: `${since}:*` },
          { uid: true, envelope: true, source: true },
        )) {
          if (account.lastSyncUid && msg.uid <= account.lastSyncUid) continue;
          fetched++;

          if (!msg.source) continue; // govdesi cekilemeyen ileti islenemez
          // Acik tip: simpleParser'in geri cagirmali asiri yuklemesi
          // secilince donus tipi `void` oluyor ve tum alanlar kayboluyor.
          const parsed: ParsedMail = await simpleParser(msg.source);
          const inReplyTo = parsed.inReplyTo ?? null;
          const from = parsed.from?.value?.[0]?.address ?? '';

          // Zinciri once In-Reply-To, sonra gonderen adresi uzerinden ariyoruz.
          const thread = inReplyTo
            ? await this.prisma.emailThread.findFirst({
                where: { messages: { some: { messageId: inReplyTo } } },
              })
            : from
              ? await this.prisma.emailThread.findFirst({
                  where: { contact: { email: from.toLowerCase() } },
                  orderBy: { lastMessageAt: 'desc' },
                })
              : null;

          if (!thread) continue;
          matched++;

          await this.prisma.emailMessage.create({
            data: {
              threadId: thread.id,
              mailAccountId: account.id,
              contactId: thread.contactId,
              direction: EmailDirection.INBOUND,
              messageId: parsed.messageId ?? `imap-${msg.uid}@local`,
              inReplyTo,
              fromAddr: from,
              // `to` tek nesne veya dizi olabiliyor; ikisini de duzluyoruz.
              toAddrs: toAddresses(parsed.to),
              subject: parsed.subject ?? '(konusuz)',
              bodyText: parsed.text ?? null,
              bodyHtml: typeof parsed.html === 'string' ? parsed.html : null,
              receivedAt: parsed.date ?? new Date(),
              imapUid: msg.uid,
              status: 'received',
            },
          });

          await this.prisma.emailThread.update({
            where: { id: thread.id },
            data: { lastMessageAt: parsed.date ?? new Date() },
          });

          // Cevap gelmesi satis acisindan en degerli olaylardan biri;
          // zaman tuneline dusmezse fark edilmeden kalir.
          await this.activities.record({
            type: 'EMAIL_IN',
            companyId: thread.companyId,
            subject: parsed.subject ?? '(konusuz)',
            body: (parsed.text ?? '').slice(0, 2000),
          });

          await this.prisma.mailAccount.update({
            where: { id: account.id },
            data: { lastSyncUid: msg.uid, lastSyncAt: new Date() },
          });
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'IMAP hatasi';
      this.logger.error(`IMAP senkron hatasi (${account.email}): ${message}`);
      await this.prisma.mailAccount.update({
        where: { id: account.id },
        data: { lastError: message.slice(0, 500) },
      });
    }

    return { fetched, matched };
  }
}

/** mailparser `to` alanini tek bicime indirger (tek nesne veya dizi olabilir). */
function toAddresses(to: ParsedMail['to']): string[] {
  if (!to) return [];
  const list = Array.isArray(to) ? to : [to];
  return list.flatMap((a) => (a.value ?? []).map((v) => v.address ?? '')).filter(Boolean);
}
