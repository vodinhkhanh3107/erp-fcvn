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
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const testing_1 = require("@nestjs/testing");
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("../../common/constants/role.enum");
const user_entity_1 = require("../user/entities/user.entity");
const auth_service_1 = require("./auth.service");
jest.mock('bcrypt');
describe('AuthService', () => {
    let service;
    let mockQueryBuilder;
    let mockJwtService;
    const fakeUser = {
        id: 1,
        fullName: 'Test User',
        email: 'test@fcvn.local',
        password: '$2b$10$hashedpasswordexample',
        role: role_enum_1.Role.ADMIN,
        status: user_entity_1.UserStatus.ACTIVE,
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: mockUserRepo,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('login()', () => {
        it('không tìm thấy email → ném UnauthorizedException("email-or-password-incorrect")', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);
            await expect(service.login({ email: 'khongton@fcvn.local', password: '123456' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('tìm thấy nhưng sai password → ném UnauthorizedException("email-or-password-incorrect")', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
            bcrypt.compare.mockResolvedValue(false);
            await expect(service.login({ email: fakeUser.email, password: 'sai-password' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('đúng password nhưng tài khoản inactive → ném UnauthorizedException("account-inactive")', async () => {
            mockQueryBuilder.getOne.mockResolvedValue({ ...fakeUser, status: user_entity_1.UserStatus.INACTIVE });
            bcrypt.compare.mockResolvedValue(true);
            await expect(service.login({ email: fakeUser.email, password: 'dung-password' })).rejects.toThrow('account-inactive');
        });
        it('email + password đúng + tài khoản active → trả về accessToken', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(fakeUser);
            bcrypt.compare.mockResolvedValue(true);
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
//# sourceMappingURL=auth.service.spec.js.map