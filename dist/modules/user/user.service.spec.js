"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const testing_1 = require("@nestjs/testing");
const user_entity_1 = require("../../models/user.entity");
const user_service_1 = require("./user.service");
jest.mock('bcrypt');
describe('UserService', () => {
    let service;
    let mockRepository;
    let mockQueryBuilder;
    const fakeUser = {
        id: 1,
        fullName: 'Nguyễn Văn A',
        email: 'a@fcvn.local',
        password: '$2b$10$hashedpassword',
        roleId: 1,
        status: user_entity_1.UserStatus.ACTIVE,
        departmentId: 1,
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
        const module = await testing_1.Test.createTestingModule({
            providers: [user_service_1.UserService, { provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User), useValue: mockRepository }],
        }).compile();
        service = module.get(user_service_1.UserService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createUser()', () => {
        it('email đã tồn tại → ném ConflictException, KHÔNG được gọi save()', async () => {
            mockRepository.findOne.mockResolvedValue(fakeUser);
            await expect(service.createUser({
                fullName: 'B',
                email: fakeUser.email,
                password: '123456',
                departmentId: fakeUser.departmentId,
                roleId: fakeUser.roleId,
            })).rejects.toThrow(common_1.ConflictException);
            expect(mockRepository.save).not.toHaveBeenCalled();
        });
        it('email chưa tồn tại → tạo thành công, KHÔNG trả password ra ngoài', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(fakeUser);
            mockRepository.save.mockResolvedValue(fakeUser);
            const result = await service.createUser({
                fullName: fakeUser.fullName,
                email: fakeUser.email,
                password: '123456',
                departmentId: 1,
            });
            expect(result.message).toBe('Tạo nhân sự thành công');
            expect(result).not.toHaveProperty('password');
            expect(result.saved.email).toBe(fakeUser.email);
        });
    });
    describe('updateStatus()', () => {
        it('trạng thái mới GIỐNG trạng thái cũ → ném BadRequestException', async () => {
            mockRepository.findOne.mockResolvedValue(fakeUser);
            await expect(service.updateStatus(1, { status: user_entity_1.UserStatus.ACTIVE })).rejects.toThrow(common_1.BadRequestException);
        });
        it('trạng thái mới KHÁC trạng thái cũ → cập nhật thành công', async () => {
            mockRepository.findOne.mockResolvedValue({ ...fakeUser });
            mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));
            const result = await service.updateStatus(1, { status: user_entity_1.UserStatus.INACTIVE });
            expect(result.message).toBe('Cập nhật trạng thái thành công');
            expect(result.saved.status).toBe(user_entity_1.UserStatus.INACTIVE);
        });
    });
});
//# sourceMappingURL=user.service.spec.js.map