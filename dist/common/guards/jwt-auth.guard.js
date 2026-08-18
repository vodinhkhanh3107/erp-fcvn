"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
const redis_service_1 = require("../redis/redis.service");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwtService, reflector, configService, redisService) {
        this.jwtService = jwtService;
        this.reflector = reflector;
        this.configService = configService;
        this.redisService = redisService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader)
            throw new common_1.UnauthorizedException('missing-token');
        const token = authHeader.split(/\s/)[1];
        let payload;
        try {
            payload = this.jwtService.verify(token, { secret: this.configService.get('jwt.secret') });
        }
        catch {
            throw new common_1.UnauthorizedException('access-denied');
        }
        const stored = await this.redisService.get(`access_token:${payload.userId}`);
        if (stored !== token) {
            throw new common_1.UnauthorizedException('token-revoked-or-replaced');
        }
        request.user = payload;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        config_1.ConfigService,
        redis_service_1.RedisService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map