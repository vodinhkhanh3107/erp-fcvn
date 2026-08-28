import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { ROLES } from '../../common/constants/role.enum';
import { User, UserStatus } from '../../models/user.entity';
import { UserService } from './user.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockRepository: any;
  let mockQueryBuilder: { addSelect: jest.Mock; where: jest.Mock; getOne: jest.Mock };

  const fakeUser = {
    id: 1,
    fullName: 'Nguyễn Văn A',
    email: 'a@fcvn.local',
    password: '$2b$10$hashedpassword',
    roleId: 1,
    status: UserStatus.ACTIVE,
    departmentId: 1
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: mockRepository }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser()', () => {
    it('email đã tồn tại → ném ConflictException, KHÔNG được gọi save()', async () => {
      mockRepository.findOne.mockResolvedValue(fakeUser); // giả lập: đã có người dùng email này

      await expect(
        service.createUser({ fullName: 'B', email: fakeUser.email, password: '123456', departmentId: fakeUser.departmentId, roleId: fakeUser.roleId }),
      ).rejects.toThrow(ConflictException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('email chưa tồn tại → tạo thành công, KHÔNG trả password ra ngoài', async () => {
      mockRepository.findOne.mockResolvedValue(null); // chưa có ai trùng email
      mockRepository.create.mockReturnValue(fakeUser);
      mockRepository.save.mockResolvedValue(fakeUser);

      const result = await service.createUser({
        fullName: fakeUser.fullName,
        email: fakeUser.email,
        password: '123456',
        departmentId: 1

      });

      expect(result.message).toBe('Tạo nhân sự thành công');
      expect(result.result).not.toHaveProperty('password'); // xác nhận password đã bị loại bỏ khỏi response
      expect(result.result.email).toBe(fakeUser.email);
    });
  });

  describe('updateStatus()', () => {
    it('trạng thái mới GIỐNG trạng thái cũ → ném BadRequestException', async () => {
      mockRepository.findOne.mockResolvedValue(fakeUser); // status hiện tại: ACTIVE

      await expect(service.updateStatus(1, { status: UserStatus.ACTIVE })).rejects.toThrow(BadRequestException);
    });

    it('trạng thái mới KHÁC trạng thái cũ → cập nhật thành công', async () => {
      mockRepository.findOne.mockResolvedValue({ ...fakeUser }); // dùng bản copy để tránh 2 test ảnh hưởng nhau
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateStatus(1, { status: UserStatus.INACTIVE });

      expect(result.message).toBe('Cập nhật trạng thái thành công');
      expect(result.result.status).toBe(UserStatus.INACTIVE);
    });
  });

//   describe('changePassword()', () => {
//     it('sai mật khẩu hiện tại → ném UnauthorizedException, KHÔNG được gọi save()', async () => {
//       mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(false); // giả lập currentPassword sai

//       await expect(
//         service.changePassword(1, { currentPassword: 'sai', newPassword: 'MatKhauMoi123' }),
//       ).rejects.toThrow(UnauthorizedException);

//       expect(mockRepository.save).not.toHaveBeenCalled();
//     });

//     it('đúng mật khẩu hiện tại → đổi thành công', async () => {
//       mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser });
//       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
//       mockRepository.save.mockResolvedValue(fakeUser);

//       const result = await service.changePassword(1, {
//         currentPassword: 'dung-password',
//         newPassword: 'MatKhauMoi123',
//       });

//       expect(result.message).toBe('Đổi mật khẩu thành công');
//       expect(mockRepository.save).toHaveBeenCalled();
//     });
//   });
});