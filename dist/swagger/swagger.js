"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerModule = swaggerModule;
const swagger_1 = require("@nestjs/swagger");
function swaggerModule(app) {
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('ERP FCVietnam API')
        .setDescription('Tài liệu API — module Employee/Auth/Supplier/SupplierGroup')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api-docs', app, swaggerDocument);
}
//# sourceMappingURL=swagger.js.map