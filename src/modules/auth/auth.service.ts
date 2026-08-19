import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { parseDurationToSeconds } from '../../common/utils/parse-duration';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private async whitelistAccessToken(userId: number, accessToken: string) {
    const ttlSeconds = parseDurationToSeconds(this.configService.get<string>('JWT_EXPIRES_IN'));
    await this.redisService.set(`access_token:${userId}`, accessToken, ttlSeconds);
  }

  private async issueTokens(user: Pick<User, 'id' | 'role' | 'email'>) {
    const payload = { userId: user.id, role: user.role, email: user.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshTokenHash });
    await this.whitelistAccessToken(user.id, accessToken); // <-- MỚI: đăng ký vào Redis

    return { accessToken, refreshToken };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) throw new UnauthorizedException('email-or-password-incorrect');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('email-or-password-incorrect');

    if (user.status !== 'active') throw new UnauthorizedException('account-inactive');

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }

  async refreshToken({ refreshToken }: RefreshTokenDto) {
    let payload: { userId: number };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      });
    } catch {
      throw new UnauthorizedException('refresh-token-invalid-or-expired');
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id: payload.userId })
      .getOne();

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('refresh-token-revoked');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('refresh-token-revoked');

    const newPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = this.jwtService.sign(newPayload);

    await this.whitelistAccessToken(user.id, accessToken); // <-- MỚI: đăng ký lại token mới vào Redis

    return { accessToken };
  }

  async logout(userId: number) {
    await this.userRepo.update(userId, { refreshTokenHash: null });
    await this.redisService.del(`access_token:${userId}`);
    return { message: 'Đăng xuất thành công' };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user-not-found');
    return user;
  }
}
