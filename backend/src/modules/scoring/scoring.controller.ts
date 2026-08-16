import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ScoringService } from './scoring.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/decorators/public.decorator';

const updateRulesSchema = z.object({
  rules: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        // Ust sinir 100: tek bir kuralin tum skoru domine etmesi
        // puanlamayi anlamsizlastirir.
        weight: z.number().int().min(0).max(100).optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(50),
});

const recalcSchema = z.object({
  companyIds: z.array(z.string().uuid()).max(5000).optional(),
});

@Controller('lead-scoring')
export class ScoringController {
  constructor(private readonly scoring: ScoringService) {}

  @Get('rules')
  rules() {
    return this.scoring.listRules();
  }

  @Roles(UserRole.ADMIN)
  @Put('rules')
  updateRules(
    @Body(new ZodValidationPipe(updateRulesSchema))
    body: { rules: Array<{ key: string; weight?: number; enabled?: boolean }> },
  ) {
    return this.scoring.updateRules(body.rules);
  }

  /** Bir isletmenin skorunun NEDEN o kadar oldugu. */
  @Get('explain/:companyId')
  async explain(@Param('companyId') companyId: string) {
    const result = await this.scoring.explain(companyId);
    if (!result) throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    return result;
  }

  @Post('recalculate')
  @HttpCode(200)
  recalculate(@Body(new ZodValidationPipe(recalcSchema)) body: { companyIds?: string[] }) {
    return this.scoring.recalculate(body.companyIds);
  }
}
