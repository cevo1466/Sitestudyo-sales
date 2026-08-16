import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { AnalyzerService } from './analyzer.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const analyzeSchema = z.object({
  // Ust sinir 500: her analiz bir dis istek; sinirsiz birakmak sunucuyu
  // ve hedef siteleri zorlar.
  companyIds: z.array(z.string().uuid()).min(1).max(500),
});

const urlSchema = z.object({ url: z.string().min(4).max(500) });

@Controller('website')
export class AnalyzerController {
  constructor(private readonly analyzer: AnalyzerService) {}

  @Post('analyze')
  @HttpCode(200)
  analyze(@Body(new ZodValidationPipe(analyzeSchema)) body: { companyIds: string[] }) {
    return this.analyzer.analyzeCompanies(body.companyIds);
  }

  /** Kayit acmadan tek adres olcer. */
  @Post('analyze-url')
  @HttpCode(200)
  analyzeUrl(@Body(new ZodValidationPipe(urlSchema)) body: { url: string }) {
    return this.analyzer.analyzeUrl(body.url);
  }

  @Get('analyses/:companyId')
  history(@Param('companyId') companyId: string) {
    return this.analyzer.history(companyId);
  }
}
