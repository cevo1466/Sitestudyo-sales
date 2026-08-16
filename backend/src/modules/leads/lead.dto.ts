import { z } from 'zod';

export const promoteSchema = z.object({
  companyId: z.string().uuid(),
  pipelineId: z.string().uuid().optional(), // verilmezse varsayilan huni
  title: z.string().trim().min(1).max(255),
  value: z.number().nonnegative().max(99999999).optional(),
  currency: z.string().length(3).default('TRY'),
});

export const updateLeadSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    value: z.number().nonnegative().max(99999999).nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export const moveSchema = z.object({
  stageId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

export const closeSchema = z
  .object({
    won: z.boolean(),
    lostReason: z.string().trim().max(500).optional(),
  })
  // Gerekcesiz kaybedilen isler sonradan analiz edilemez: "neden
  // kaybediyoruz" sorusunun cevabi bu alanda birikiyor.
  .refine((d) => d.won || Boolean(d.lostReason), {
    message: 'Kaybedilen is icin gerekce zorunlu',
    path: ['lostReason'],
  });

export const listLeadSchema = z.object({
  stageId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['open', 'closed', 'all']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PromoteDto = z.infer<typeof promoteSchema>;
export type ListLeadQuery = z.infer<typeof listLeadSchema>;
