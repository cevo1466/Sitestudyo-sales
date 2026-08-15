import { z } from 'zod';
import { companyFilterSchema } from './company-filter.dto';

/** promote icin ust sinir; gerekcesi company-bulk.service.ts icinde. */
export const PROMOTE_LIMIT = 200;

export const bulkSchema = z.object({
  filter: companyFilterSchema,
  excludeIds: z.array(z.string().uuid()).max(500).default([]),
  action: z.enum(['tag', 'untag', 'promote', 'dnc']),
  payload: z
    .object({
      tagIds: z.array(z.string().uuid()).min(1).max(10).optional(),
      pipelineId: z.string().uuid().optional(),
    })
    .default({}),
  /**
   * Istemcinin ekranda GORDUGU sayi. Verilirse sunucu kendi saydigi sayiyla
   * karsilastirir ve tutmuyorsa hicbir sey yapmaz. Gorulen ile yapilanin
   * ayni kume olmasini garanti eder.
   */
  confirmCount: z.number().int().min(0).optional(),
});

export type BulkDto = z.infer<typeof bulkSchema>;

export interface BulkResult {
  matched: number;
  applied: number;
  skipped: number;
}
