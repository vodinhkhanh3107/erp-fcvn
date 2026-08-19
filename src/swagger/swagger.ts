import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";


export function swaggerModule(app) {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('ERP FCVietnam API')
        .setDescription('Tài liệu API — module Employee/Auth/Supplier/SupplierGroup')
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'access-token',
        )
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, swaggerDocument);
}