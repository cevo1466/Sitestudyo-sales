import { ActivityType } from '@prisma/client';
import { z } from 'zod';

export const createActivitySchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    // SYSTEM ve STAGE_CHANGE disarida: onlari yalnizca sistem uretir. Elle
    // yazilabilseydi denetim izi uydurulabilir hale gelirdi.
    type: z.enum([
      ActivityType.CALL,
      ActivityType.MEETING,
      ActivityType.EMAIL_OUT,
      ActivityType.EMAIL_IN,
      ActivityType.NOTE,
    ]),
    subject: z.string().trim().max(255).optional(),
    body: z.string().trim().max(10000).optional(),
    occurredAt: z.coerce.date().optional(),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const listActivitySchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  // Filtresiz sorgu tum sistemin zaman tunelini ceker; anlamsiz ve pahali.
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const createNoteSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    body: z.string().trim().min(1, 'Not bos olamaz').max(10000),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const updateNoteSchema = z.object({
  body: z.string().trim().min(1, 'Not bos olamaz').max(10000),
});

export const listNoteSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });
