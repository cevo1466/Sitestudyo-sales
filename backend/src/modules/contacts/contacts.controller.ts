import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { ContactsService } from './contacts.service';
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactDto,
  type UpdateContactDto,
} from './contact.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const listSchema = z.object({ companyId: z.string().uuid() });

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listSchema)) q: { companyId: string }) {
    return this.contacts.listByCompany(q.companyId);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createContactSchema)) dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateContactSchema)) dto: UpdateContactDto,
  ) {
    return this.contacts.update(id, dto);
  }

  @Post(':id/primary')
  @HttpCode(200)
  setPrimary(@Param('id') id: string) {
    return this.contacts.setPrimary(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.contacts.remove(id);
  }
}
