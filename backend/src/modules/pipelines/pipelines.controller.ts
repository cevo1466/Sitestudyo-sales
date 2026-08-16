import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { createPipelineSchema, replaceStagesSchema, type StageInput } from './pipeline.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  list() {
    return this.pipelines.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createPipelineSchema)) dto: { name: string }) {
    return this.pipelines.create(dto);
  }

  @Put(':id/stages')
  replaceStages(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replaceStagesSchema)) dto: { stages: StageInput[] },
  ) {
    return this.pipelines.replaceStages(id, dto.stages);
  }
}
