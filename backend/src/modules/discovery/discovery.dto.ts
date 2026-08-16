import { z } from 'zod';

export const startRunSchema = z.object({
  searchTerms: z.array(z.string().trim().min(2).max(80)).min(1).max(20),
  locationQuery: z.string().trim().max(120).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusM: z.number().int().min(500).max(50000).optional(),
  // Ust sinir 200: her arama x terim ayri ucretlendiriliyor, kaza ile
  // butun krediyi tek calismaya yatirmayi engelliyoruz.
  maxPerSearch: z.number().int().min(1).max(200).default(100),
  language: z.string().length(2).default('tr'),
  countryCode: z.string().length(2).default('tr'),
  onlyWithoutWebsite: z.boolean().default(true),
  account: z.enum(['primary', 'secondary']).default('primary'),
});

export const importDatasetSchema = z.object({
  datasetId: z.string().trim().min(5).max(60),
  /** Bu veri kumesi withoutWebsite filtresiyle mi toplandi? */
  onlyWithoutWebsite: z.boolean(),
  account: z.enum(['primary', 'secondary']).default('primary'),
});

export type StartRunBody = z.infer<typeof startRunSchema>;
export type ImportDatasetBody = z.infer<typeof importDatasetSchema>;
