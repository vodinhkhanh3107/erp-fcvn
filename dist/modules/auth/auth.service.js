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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const redis_service_1 = require("../../common/redis/redis.service");
const parse_duration_1 = require("../../common/utils/parse-duration");
const user_entity_1 = require("../user/entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepo, jwtService, configService, redisService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
    }
    async whitelistAccessToken(userId, accessToken) {
        const ttlSeconds = (0, parse_duration_1.parseDurationToSeconds)(this.configService.get('JWT_EXPIRES_IN'));
        await this.redisService.set(`access_token:${userId}`, accessToken, ttlSeconds);
    }
    async issueTokens(user) {
        const payload = { userId: user.id, role: user.role, email: user.email };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET_KEY'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.update(user.id, { refreshTokenHash });
        await this.whitelistAccessToken(user.id, accessToken);
        return { accessToken, refreshToken };
    }
    async login({ email, password }) {
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
        if (!user)
            throw new common_1.UnauthorizedException('email-or-password-incorrect');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('email-or-password-incorrect');
        if (user.status !== 'active')
            throw new common_1.UnauthorizedException('account-inactive');
        const { accessToken, refreshToken } = await this.issueTokens(user);
        return {
            accessToken,
            refreshToken,
            user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        };
    }
    async refreshToken({ refreshToken }) {
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET_KEY'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('refresh-token-invalid-or-expired');
        }
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.refreshTokenHash')
            .where('user.id = :id', { id: payload.userId })
            .getOne();
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('refresh-token-revoked');
        }
        const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isMatch)
            throw new common_1.UnauthorizedException('refresh-token-revoked');
        const newPayload = { userId: user.id, role: user.role, email: user.email };
        const accessToken = this.jwtService.sign(newPayload);
        await this.whitelistAccessToken(user.id, accessToken);
        return { accessToken };
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshTokenHash: null });
        await this.redisService.del(`access_token:${userId}`);
        return { message: 'Đăng xuất thành công' };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('user-not-found');
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map