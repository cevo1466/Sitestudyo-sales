import { ContactConfidence } from '@prisma/client';
import { z } from 'zod';

const base = {
  name: z.string().trim().max(160).nullable().optional(),
  role: z.string().trim().max(120).nullable().optional(),
  // toLowerCase: aksi halde ayni adres iki farkli kayit olur ve
  // (companyId, email) benzersizligi ise yaramaz.
  email: z.string().email().max(191).toLowerCase().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  confidence: z.nativeEnum(ContactConfidence).optional(),
};

export const createContactSchema = z
  .object({ companyId: z.string().uuid(), ...base })
  .strict()
  // Iletisim bilgisi olmayan kisi kaydinin hicbir islevi yok.
  .refine((d) => Boolean(d.email || d.phone), {
    message: 'E-posta veya telefon zorunlu',
    path: ['email'],
  });

export const updateContactSchema = z
  .object(base)
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export type CreateContactDto = z.infer<typeof createContactSchema>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
