"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
require("dotenv/config");
const app_logger_service_1 = require("./common/logger/app-logger.service");
const swagger_1 = require("./swagger/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(new app_logger_service_1.AppLogger());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    (0, swagger_1.swaggerModule)(app);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Server đang chạy tại http://localhost:${port});
}
bootstrap();
    );
}
//# sourceMappingURL=main.js.map