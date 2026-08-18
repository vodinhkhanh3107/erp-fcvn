import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../common/redis/redis.service';
import { Role } from '../../common/constants/role.enum';
import { User, UserStatus } from '../user/entities/user.entity';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockQueryBuilder: { addSelect: jest.Mock; where: jest.Mock; getOne: jest.Mock };
  let mockUserRepo: any;
  let mockJwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let mockConfigService: Partial<Record<keyof ConfigService, jest.Mock>>;
  let mockRedisService: Partial<Record<keyof RedisService, jest.Mock>>;

  const fakeUser = {
    id: 1,
    fullName: 'Test User',
    email: 'test@fcvn.local',
    password: '$2b$10$hashedpasswordexample',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockUserRepo = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };

    mockJwtService = { sign: jest.fn(), verify: jest.fn() };

    mockConfigService = {
      get: jest.fn((key: string) => (key === 'JWT_EXPIRES_IN' ? '8h' : `fake-${key}`)),
    };

    mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('fake-refresh-token-hash');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('không tìm thấy email → ném UnauthorizedException', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.login({ email: 'khongton@fcvn.local', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('sai password → ném UnauthorizedException', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: fakeUser.email, password: 'sai' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('tài khoản inactive → ném UnauthorizedException("account-inactive")', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, status: UserStatus.INACTIVE });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login({ email: fakeUser.email, password: 'dung' })).rejects.toThrow(
        'account-inactive',
      );
    });

    it('đúng thông tin → trả về token, lưu refreshTokenHash vào DB, VÀ ghi accessToken vào Redis', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.sign as jest.Mock)
        .mockReturnValueOnce('fake-access-token')
        .mockReturnValueOnce('fake-refresh-token');

      const result = await service.login({ email: fakeUser.email, password: 'dung' });

      expect(result.accessToken).toBe('fake-access-token');
      expect(mockUserRepo.update).toHaveBeenCalledWith(fakeUser.id, {
        refreshTokenHash: 'fake-refresh-token-hash',
      });
      // Xác nhận đúng key + đúng token + TTL = 8h quy đổi ra giây (8 * 3600 = 28800)
      expect(mockRedisService.set).toHaveBeenCalledWith('access_token:1', 'fake-access-token', 28800);
    });
  });

  describe('refreshToken()', () => {
    it('token sai chữ ký/hết hạn → ném UnauthorizedException', async () => {
      (mockJwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshToken({ refreshToken: 'token-gia' })).rejects.toThrow(
        'refresh-token-invalid-or-expired',
      );
    });

    it('đã bị logout trước đó (refreshTokenHash = null) → ném UnauthorizedException', async () => {
      (mockJwtService.verify as jest.Mock).mockReturnValue({ UserId: 1 });
      mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, refreshTokenHash: null });

      await expect(service.refreshToken({ refreshToken: 'token' })).rejects.toThrow('refresh-token-revoked');
    });

    it('hợp lệ → trả về accessToken mới, VÀ ghi đè lại Redis với token mới', async () => {
      (mockJwtService.verify as jest.Mock).mockReturnValue({ UserId: 1 });
      mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, refreshTokenHash: 'fake-refresh-token-hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.sign as jest.Mock).mockReturnValue('fake-new-access-token');

      const result = await service.refreshToken({ refreshToken: 'token-that' });

      expect(result.accessToken).toBe('fake-new-access-token');
      expect(mockRedisService.set).toHaveBeenCalledWith('access_token:1', 'fake-new-access-token', 28800);
    });
  });

  describe('logout()', () => {
    it('xóa refreshTokenHash trong DB VÀ xóa accessToken khỏi Redis', async () => {
      const result = await service.logout(1);

      expect(mockUserRepo.update).toHaveBeenCalledWith(1, { refreshTokenHash: null });
      expect(mockRedisService.del).toHaveBeenCalledWith('access_token:1');
      expect(result.message).toBe('Đăng xuất thành công');
    });
  });

  describe('getProfile()', () => {
    it('không tìm thấy nhân sự → ném NotFoundException', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });

    it('tìm thấy → trả về đúng thông tin nhân sự', async () => {
      mockUserRepo.findOne.mockResolvedValue(fakeUser);

      const result = await service.getProfile(1);

      expect(result).toEqual(fakeUser);
    });
  });
});
