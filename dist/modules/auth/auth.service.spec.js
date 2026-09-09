"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const testing_1 = require("@nestjs/testing");
const bcrypt = __importStar(require("bcrypt"));
const redis_service_1 = require("../../common/redis/redis.service");
const role_enum_1 = require("../../common/constants/role.enum");
const user_entity_1 = require("../../models/user.entity");
const auth_service_1 = require("./auth.service");
jest.mock('bcrypt');
describe('AuthService', () => {
    let service;
    let mockQueryBuilder;
    let mockUserRepo;
    let mockJwtService;
    let mockConfigService;
    let mockRedisService;
    const fakeUser = {
        id: 1,
        fullName: 'Test User',
        email: 'test@fcvn.local',
        password: '$2b$10$hashedpasswordexample',
        role: role_enum_1.ROLES.ADMIN,
        status: user_entity_1.UserStatus.ACTIVE,
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
            get: jest.fn((key) => (key === 'JWT_EXPIRES_IN' ? '8h' : `fake-${key}`)),
        };
        mockRedisService = {
            set: jest.fn().mockResolvedValue(undefined),
            get: jest.fn(),
            del: jest.fn().mockResolvedValue(undefined),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User), useValue: mockUserRepo },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: redis_service_1.RedisService, useValue: mockRedisService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        bcrypt.hash.mockResolvedValue('fake-refresh-token-hash');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('login()', () => {
        it('không tìm thấy email → ném UnauthorizedException', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);
            await expect(service.login({ email: 'khongton@fcvn.local', password: '123456' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('sai password → ném UnauthorizedException', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
            bcrypt.compare.mockResolvedValue(false);
            await expect(service.login({ email: fakeUser.email, password: 'sai' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('tài khoản inactive → ném UnauthorizedException("account-inactive")', async () => {
            mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, status: user_entity_1.UserStatus.INACTIVE });
            bcrypt.compare.mockResolvedValue(true);
            await expect(service.login({ email: fakeUser.email, password: 'dung' })).rejects.toThrow('account-inactive');
        });
        it('đúng thông tin → trả về token, lưu refreshTokenHash vào DB, VÀ ghi accessToken vào Redis', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
            bcrypt.compare.mockResolvedValue(true);
            mockJwtService.sign
                .mockReturnValueOnce('fake-access-token')
                .mockReturnValueOnce('fake-refresh-token');
            const result = await service.login({ email: fakeUser.email, password: 'dung' });
            expect(result.accessToken).toBe('fake-access-token');
            expect(mockUserRepo.update).toHaveBeenCalledWith(fakeUser.id, {
                refreshTokenHash: 'fake-refresh-token-hash',
            });
            expect(mockRedisService.set).toHaveBeenCalledWith('access_token:1', 'fake-access-token', 28800);
        });
    });
    describe('refreshToken()', () => {
        it('token sai chữ ký/hết hạn → ném UnauthorizedException', async () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('jwt expired');
            });
            await expect(service.refreshToken({ refreshToken: 'token-gia' })).rejects.toThrow('refresh-token-invalid-or-expired');
        });
        it('đã bị logout trước đó (refreshTokenHash = null) → ném UnauthorizedException', async () => {
            mockJwtService.verify.mockReturnValue({ UserId: 1 });
            mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, refreshTokenHash: null });
            await expect(service.refreshToken({ refreshToken: 'token' })).rejects.toThrow('refresh-token-revoked');
        });
        it('hợp lệ → trả về accessToken mới, VÀ ghi đè lại Redis với token mới', async () => {
            mockJwtService.verify.mockReturnValue({ UserId: 1 });
            mockQueryBuilder.getOne.mockResolvedValue({
                ...fakeUser,
                refreshTokenHash: 'fake-refresh-token-hash',
            });
            bcrypt.compare.mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('fake-new-access-token');
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
            await expect(service.getProfile(999)).rejects.toThrow(common_1.NotFoundException);
        });
        it('tìm thấy → trả về đúng thông tin nhân sự', async () => {
            mockUserRepo.findOne.mockResolvedValue(fakeUser);
            const result = await service.getProfile(1);
            expect(result).toEqual(fakeUser);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map