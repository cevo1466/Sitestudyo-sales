import { z } from 'zod';

/**
 * Yalnizca ELLE duzeltilebilecek alanlar.
 *
 * leadScore, websiteStatus ve leadGrade bilerek disarida: onlari puanlama
 * motoru (Faz 4) hesapliyor. Elle degistirilebilseydi motorun bir sonraki
 * calismasinda sessizce ustune yazilir ve kullanici duzeltmesinin neden
 * kayboldugunu anlayamazdi.
 */
export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    phoneE164: z
      .string()
      .trim()
      .regex(/^\+\d{7,15}$/, 'E.164 bicimi olmali (ornek: +905551234567)')
      .nullable()
      .optional(),
    websiteUrl: z.string().url().max(500).nullable().optional(),
    sector: z.string().trim().max(60).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    district: z.string().trim().max(80).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
  })
  // strict: tanimsiz alan gonderilirse 400 doner, sessizce yutulmaz.
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
