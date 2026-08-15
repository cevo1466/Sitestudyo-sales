import { LeadGrade, WebsiteStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * "true"/"false" metnini boolean'a cevirir.
 *
 * z.coerce.boolean() BURADA KULLANILAMAZ: JavaScript'te Boolean("false")
 * true doner. Sorgu dizesinden gelen ?hasPhone=false o zaman "telefonu
 * olanlar" filtresine donusur ve kimse fark etmez.
 */
const boolFromString = z.enum(['true', 'false']).transform((v) => v === 'true');

export const companyFilterSchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(60).optional(),
    websiteStatus: z.array(z.nativeEnum(WebsiteStatus)).min(1).optional(),
    leadGrade: z.array(z.nativeEnum(LeadGrade)).min(1).optional(),
    tags: z.array(z.string().trim().max(60)).min(1).max(10).optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
    maxScore: z.coerce.number().int().min(0).max(100).optional(),
    hasPhone: boolFromString.optional(),
    hasEmail: boolFromString.optional(),
  })
  .refine((f) => f.minScore === undefined || f.maxScore === undefined || f.minScore <= f.maxScore, {
    message: 'minScore, maxScore degerinden buyuk olamaz',
    path: ['minScore'],
  });

export type CompanyFilter = z.infer<typeof companyFilterSchema>;
