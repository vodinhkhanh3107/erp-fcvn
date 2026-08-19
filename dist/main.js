"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
require("dotenv/config");
const app_logger_service_1 = require("./common/logger/app-logger.service");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(new app_logger_service_1.AppLogger());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('ERP FCVietnam API')
        .setDescription('Tài liệu API — module Employee/Auth/Supplier/SupplierGroup')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api-docs', app, swaggerDocument);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Server đang chạy tại http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map