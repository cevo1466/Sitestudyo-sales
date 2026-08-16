import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { CrawlerService } from './crawler.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// Ust sinir 200: her isletme icin 4'e kadar dis istek atiliyor ve
// aralarinda nezaket beklemesi var; sinirsiz birakmak saatler surerdi.
const crawlSchema = z.object({ companyIds: z.array(z.string().uuid()).min(1).max(200) });

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawler: CrawlerService) {}

  @Post('contacts')
  @HttpCode(200)
  crawl(@Body(new ZodValidationPipe(crawlSchema)) body: { companyIds: string[] }) {
    return this.crawler.crawlCompanies(body.companyIds);
  }
}
