import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }

  @Post('logout')
  logout(@CurrentUser() user: { userId: number }) {
    return this.authService.logout(user.userId);
  }

  @Get('me')
  getProfile(@CurrentUser() user: { userId: number }) {
    return this.authService.getProfile(user.userId);
  }
}
