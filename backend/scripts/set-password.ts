/**
 * Bir kullanicinin sifresini degistirir.
 *
 *   npx ts-node --transpile-only scripts/set-password.ts <e-posta> <yeni-sifre>
 *
 * Sifre AuthService ile AYNI argon2id parametreleriyle hash'leniyor.
 * Elle SQL yazip baska bir hash uretmek, girisi sessizce bozardi.
 *
 * Sifre komut satirinda gecer; kabuk gecmisine dusmemesi icin komutun
 * basina bosluk koyun veya isiniz bitince `history -d` ile silin.
 */
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/modules/auth/auth.service';

async function main(): Promise<void> {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Kullanim: set-password.ts <e-posta> <yeni-sifre>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`Kullanici bulunamadi: ${email}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await AuthService.hashPassword(password) },
  });

  // Acik oturumlari da kapatiyoruz: sifre degistirmenin amaci eski
  // erisimi kesmekse, elinde refresh token olan biri hala icerideyken
  // is yarim kalmis olur.
  const revoked = await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log(`Sifre degistirildi: ${user.email}`);
  console.log(`Kapatilan acik oturum: ${revoked.count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
