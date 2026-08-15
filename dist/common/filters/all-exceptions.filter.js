"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("../logger/app-logger.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor() {
        this.logger = new app_logger_service_1.AppLogger();
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttpException = exception instanceof common_1.HttpException;
        const status = isHttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = isHttpException ? exception.getResponse() : null;
        const message = isHttpException
            ? typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse?.message || exception.message
            : 'Internal server error';
        const errorBody = {
            success: false,
            statusCode: status,
            path: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
            message,
        };
        if (status >= 500) {
            this.logger.error(JSON.stringify(errorBody), exception?.stack, 'ExceptionFilter');
        }
        else {
            this.logger.warn(JSON.stringify(errorBody), 'ExceptionFilter');
        }
        response.status(status).json(errorBody);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map