import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginSchema, refreshSchema, type LoginDto, type RefreshDto } from './dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { clientIp, userAgent, type IpBearingRequest } from '../../common/http/client-ip';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Req() req: IpBearingRequest) {
    return this.auth.login(dto.email, dto.password, {
      ip: clientIp(req),
      userAgent: userAgent(req),
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto, @Req() req: IpBearingRequest) {
    return this.auth.refresh(dto.refreshToken, {
      ip: clientIp(req),
      userAgent: userAgent(req),
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
