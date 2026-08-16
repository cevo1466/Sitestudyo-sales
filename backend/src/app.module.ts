import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { validateEnv } from './config/env';
import { PrismaModule } from './common/prisma/prisma.module';
import { CryptoService } from './common/services/crypto.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CrmSharedModule } from './modules/crm-shared/crm-shared.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { LeadsModule } from './modules/leads/leads.module';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [CryptoService],
  exports: [CryptoService, JwtModule],
})
class CoreModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    CoreModule,
    HealthModule,
    AuthModule,
    CrmSharedModule,
    CompaniesModule,
    ContactsModule,
    PipelinesModule,
    LeadsModule,
  ],
  providers: [
    // SIRA ONEMLI: once kimlik (JwtAuthGuard req.user'i doldurur),
    // sonra yetki (RolesGuard onu okur).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
