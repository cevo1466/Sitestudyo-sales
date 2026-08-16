import { z } from 'zod';

export const createPipelineSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const stageSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_]{1,40}$/, 'key kucuk harf, rakam ve alt cizgi olmali'),
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const replaceStagesSchema = z
  .object({ stages: z.array(stageSchema).min(1).max(20) })
  .refine((d) => new Set(d.stages.map((s) => s.key)).size === d.stages.length, {
    message: 'Asama anahtarlari (key) benzersiz olmali',
    path: ['stages'],
  })
  .refine((d) => !d.stages.some((s) => s.isWon && s.isLost), {
    message: 'Bir asama hem kazanildi hem kaybedildi olamaz',
    path: ['stages'],
  });

export type StageInput = z.infer<typeof stageSchema>;
