import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../../common/constants/role.enum';
import { User, UserStatus } from '../user/entities/user.entity';
import { AuthService } from './auth.service';


jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockQueryBuilder: {
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let mockJwtService: Partial<Record<keyof JwtService, jest.Mock>>;

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

    const mockUserRepo = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User), // token mà @InjectRepository(User) tìm kiếm
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // reset lại số lần gọi/tham số của mọi mock, tránh lẫn giữa các bài test
  });

  describe('login()', () => {
    it('không tìm thấy email → ném UnauthorizedException("email-or-password-incorrect")', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null); // giả lập: không có User nào khớp email

      await expect(service.login({ email: 'khongton@fcvn.local', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('tìm thấy nhưng sai password → ném UnauthorizedException("email-or-password-incorrect")', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // giả lập bcrypt báo "không khớp"

      await expect(service.login({ email: fakeUser.email, password: 'sai-password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('đúng password nhưng tài khoản inactive → ném UnauthorizedException("account-inactive")', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, status: UserStatus.INACTIVE });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login({ email: fakeUser.email, password: 'dung-password' })).rejects.toThrow(
        'account-inactive',
      );
    });

    it('email + password đúng + tài khoản active → trả về accessToken', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: fakeUser.email, password: 'dung-password' });

      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.user.email).toBe(fakeUser.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: fakeUser.id,
        role: fakeUser.role,
        email: fakeUser.email,
      });
    });
  });
});