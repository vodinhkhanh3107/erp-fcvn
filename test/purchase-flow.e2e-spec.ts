import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { FILE_STORAGE_SERVICE, IFileStorageService } from 'src/common/file-storage/file-storage.interface';
import * as os from 'os'

dotenv.config();


const fakeFileStorageService: IFileStorageService = {
  upload: async (file, folder) => ({
    fileUrl: `https://fake-storage.test/${folder}/${Date.now()}-${file.originalname}`,
    fileName: file.originalname,
    fileSize: file.size,
    storageKey: `fake-key-${Date.now()}`,
  }),
  delete: async () => { },
};

describe('Luồng Purchase Request đầy đủ (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let adminUserId: number;

  let departmentId: number;
  let supplierAId: number;
  let supplierBId: number;
  let purchaseRequestId: number;
  let itemId: number;

  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(FILE_STORAGE_SERVICE).useValue(fakeFileStorageService).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Đăng nhập bằng tài khoản admin đã được seed sẵn (npm run seed)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `${process.env.EMAIL_USER}@fcvn.local`,
        password: process.env.PASSWORD_USER,
      });

    expect(loginRes.status).toBe(201); // hoặc 200 tuỳ decorator @HttpCode thật của AuthController
    accessToken = loginRes.body.accessToken;
    adminUserId = loginRes.body.user?.id;

    expect(accessToken).toBeDefined();
    expect(adminUserId).toBeDefined();
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200)); // đợi queryRunner release xong
    await app.close();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  it('Bước 1: Tạo phòng ban và gán chính admin làm manager (để đủ điều kiện approve sau này)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/departments')
      .set(authHeader())
      .send({ name: `Phòng Test E2E ${uniqueSuffix}` });

    expect(createRes.status).toBe(201);
    departmentId = createRes.body.result.id;
    expect(departmentId).toBeDefined();

    // Gán managerId = chính admin đang đăng nhập — GIẢ ĐỊNH field này tồn tại trong
    // UpdateDepartmentDto. Nếu API thật không nhận field này, sửa lại đúng cách gán manager.
    const assignManagerRes = await request(app.getHttpServer())
      .put(`/departments/${departmentId}`)
      .set(authHeader())
      .send({ managerId: adminUserId });

    expect(assignManagerRes.status).toBe(200);
  });

  it('Bước 2: Tạo 2 nhà cung cấp (mỗi vật tư cần báo giá từ 2 nhà cung cấp khác nhau)', async () => {
    const supplierARes = await request(app.getHttpServer())
      .post('/suppliers')
      .set(authHeader())
      .send({
        name: `Nhà cung cấp A ${uniqueSuffix}`,
        taxCode: `TAXA-${uniqueSuffix}`,
        contactEmail: `supplier-a-${uniqueSuffix}@example.com`,
      });
    expect(supplierARes.status).toBe(201);
    supplierAId = supplierARes.body.result.id;

    const supplierBRes = await request(app.getHttpServer())
      .post('/suppliers')
      .set(authHeader())
      .send({
        name: `Nhà cung cấp B ${uniqueSuffix}`,
        taxCode: `TAXB-${uniqueSuffix}`,
        contactEmail: `supplier-b-${uniqueSuffix}@example.com`,
      });
    expect(supplierBRes.status).toBe(201);
    supplierBId = supplierBRes.body.result.id;

    expect(supplierAId).toBeDefined();
    expect(supplierBId).toBeDefined();
  });

  it('Bước 3: Gắn báo giá (upload file) cho CẢ 2 nhà cung cấp — điều kiện bắt buộc để tạo PR thành công', async () => {
    // File giả lập tối thiểu hợp lệ theo ALLOWED_MIME_TYPES — dùng PDF vì hầu như
    // luôn nằm trong danh sách cho phép của các hệ thống quản lý chứng từ.
    const fakePdfBuffer = Buffer.from('%PDF-1.4 fake content for e2e test');

    const uploadForA = await request(app.getHttpServer())
      .post(`/suppliers/${supplierAId}/quotations`)
      .set(authHeader())
      .attach('file', fakePdfBuffer, 'quotation-a.pdf');
    expect(uploadForA.status).toBe(201);

    const uploadForB = await request(app.getHttpServer())
      .post(`/suppliers/${supplierBId}/quotations`)
      .set(authHeader())
      .attach('file', fakePdfBuffer, 'quotation-b.pdf');
    expect(uploadForB.status).toBe(201);
  });

  it('Bước 4: Tạo Purchase Request kèm 1 vật tư, 2 báo giá từ 2 nhà cung cấp đã gắn báo giá ở Bước 3', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(authHeader())
      .send({
        departmentId,
        purposeOfUse: 'Mua màn hình phục vụ E2E test',
        items: [
          {
            itemName: 'Màn hình máy tính',
            quantity: 2,
            quotations: [
              { supplierId: supplierAId, quotedAmount: 15000000 },
              { supplierId: supplierBId, quotedAmount: 14000000 },
            ],
          },
        ],
      });

    expect(createRes.status).toBe(201);
    purchaseRequestId = createRes.body.result.id;
    expect(purchaseRequestId).toBeDefined();
    // create() hiện tại LUÔN set status = PENDING nếu qua được điều kiện
    // determineInitialStatus (cả 2 supplier đã có SupplierQuotation từ Bước 3)
    expect(createRes.body.result.status).toBe('PENDING');
  });

  it('Bước 5: Lấy chi tiết PR để biết itemId thật (cần cho bước issue-po sau này)', async () => {
    const getRes = await request(app.getHttpServer())
      .get(`/purchase-requests/${purchaseRequestId}`)
      .set(authHeader());

    expect(getRes.status).toBe(200);
    expect(getRes.body.items).toHaveLength(1);
    itemId = getRes.body.items[0].id;
    expect(itemId).toBeDefined();
  });

  it('Bước 6: Upload chữ ký (sign) — chuyển PR từ PENDING sang SIGNED', async () => {
    const fakeSignatureBuffer = Buffer.from('%PDF-1.4 fake signature for e2e test');

    const signRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${purchaseRequestId}/sign`)
      .set(authHeader())
      .attach('file', fakeSignatureBuffer, 'signature.pdf');

    expect(signRes.status).toBe(201);
    expect(signRes.body.result.status).toBe('SIGNED');
  });

  it('Bước 7: Phê duyệt PR — YÊU CẦU approve() đã được sửa để check status SIGNED', async () => {
    const approveRes = await request(app.getHttpServer())
      .put(`/purchase-requests/${purchaseRequestId}/approve`)
      .set(authHeader());

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.result.status).toBe('APPROVED');
  });

  it('Bước 8: Phát hành Purchase Order — chọn nhà cung cấp A cho vật tư duy nhất', async () => {
    const issueRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${purchaseRequestId}/issue-po`)
      .set(authHeader())
      .send({
        paymentTerm: 'NET30',
        selections: [{ itemId, selectedSupplierId: supplierAId }],
      });

    expect(issueRes.status).toBe(201);
    expect(issueRes.body.result).toHaveLength(1); // 1 nhà cung cấp được chọn → đúng 1 PO
    expect(issueRes.body.result[0].totalAmount).toBe(15000000); // đúng giá đã báo của supplier A
  });

  it('Bước 9: Gọi lại issue-po lần 2 cho cùng PR — phải bị chặn (chống trùng)', async () => {
    const duplicateIssueRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${purchaseRequestId}/issue-po`)
      .set(authHeader())
      .send({
        paymentTerm: 'NET30',
        selections: [{ itemId, selectedSupplierId: supplierAId }],
      });

    expect(duplicateIssueRes.status).toBe(409); // ConflictException
  });

  // NHÓM TEST BỔ SUNG — Sai quyền / Thiếu báo giá / Chưa duyệt / Performance
 
  it('Negative: user KHÔNG có quyền issue-po thì bị chặn (403), dù PR hợp lệ', async () => {
    // Tạo 1 role "giới hạn" — CHỈ có quyền đọc, KHÔNG có quyền issue-po.
    const limitedRoleRes = await request(app.getHttpServer())
      .post('/roles')
      .set(authHeader())
      .send({ code: `limited-${uniqueSuffix}`, name: 'Role giới hạn (test)' });
    expect(limitedRoleRes.status).toBe(201);
    const limitedRoleId = limitedRoleRes.body.result.id;
 
    await request(app.getHttpServer())
      .put(`/roles/${limitedRoleId}/permissions`)
      .set(authHeader())
      .send({ permissionCodes: ['purchase-request.read'] }) // cố tình KHÔNG có 'purchase-request.issue'
      .expect(200);
 
    // Tạo user mới gắn role giới hạn này
    const limitedUserEmail = `limited-user-${uniqueSuffix}@example.com`;
    const createUserRes = await request(app.getHttpServer())
      .post('/users')
      .set(authHeader())
      .send({
        fullName: 'User Giới Hạn Test',
        email: limitedUserEmail,
        password: 'Password123',
        roleId: limitedRoleId,
        departmentId
      });
    expect(createUserRes.status).toBe(201);
 
    // Đăng nhập bằng user giới hạn này
    const limitedLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: limitedUserEmail, password: 'Password123' });
    const limitedToken = limitedLoginRes.body.accessToken;
    expect(limitedToken).toBeDefined();
 
    const forbiddenRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${purchaseRequestId}/issue-po`)
      .set({ Authorization: `Bearer ${limitedToken}` })
      .send({ selections: [{ itemId, selectedSupplierId: supplierAId }] });
 
    expect(forbiddenRes.status).toBe(403);
  });
 
  it('Negative: tạo PR bị chặn (400) nếu có nhà cung cấp CHƯA từng upload báo giá', async () => {
    // Nhà cung cấp mới hoàn toàn — CHƯA gọi upload quotation lần nào
    const newSupplierRes = await request(app.getHttpServer())
      .post('/suppliers')
      .set(authHeader())
      .send({
        name: `Nhà cung cấp chưa báo giá ${uniqueSuffix}`,
        taxCode: `TAXC-${uniqueSuffix}`,
        contactEmail: `supplier-c-${uniqueSuffix}@example.com`,
      });
    expect(newSupplierRes.status).toBe(201);
    const supplierWithoutQuotationId = newSupplierRes.body.result.id;
 
    const createRes = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(authHeader())
      .send({
        departmentId,
        purposeOfUse: 'Test thiếu báo giá',
        items: [
          {
            itemName: 'Vật tư test thiếu báo giá',
            quantity: 1,
            quotations: [
              { supplierId: supplierAId, quotedAmount: 1000000 },
              { supplierId: supplierWithoutQuotationId, quotedAmount: 900000 },
            ],
          },
        ],
      });
 
    expect(createRes.status).toBe(400);
    expect(createRes.body.message).toContain('supplier-not-have-quotation-or-not-have-supplier');
  });
 
  it('Negative: issue-po bị chặn (400) khi PR mới chỉ SIGNED, CHƯA được approve', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(authHeader())
      .send({
        departmentId,
        purposeOfUse: 'Test chưa duyệt',
        items: [
          {
            itemName: 'Vật tư test chưa duyệt',
            quantity: 1,
            quotations: [
              { supplierId: supplierAId, quotedAmount: 500000 },
              { supplierId: supplierBId, quotedAmount: 480000 },
            ],
          },
        ],
      });
    expect(createRes.status).toBe(201);
    const notApprovedPrId = createRes.body.result.id;
 
    const getRes = await request(app.getHttpServer())
      .get(`/purchase-requests/${notApprovedPrId}`)
      .set(authHeader());
    const notApprovedItemId = getRes.body.items[0].id;
 
    const signRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${notApprovedPrId}/sign`)
      .set(authHeader())
      .attach('file', Buffer.from('%PDF-1.4 fake signature'), 'sig-not-approved.pdf');
    expect(signRes.status).toBe(201);
    expect(signRes.body.result.status).toBe('SIGNED');
    // CỐ TÌNH KHÔNG gọi approve() — để trạng thái dừng lại ở SIGNED, chưa APPROVED
 
    const issueRes = await request(app.getHttpServer())
      .post(`/purchase-requests/${notApprovedPrId}/issue-po`)
      .set(authHeader())
      .send({ selections: [{ itemId: notApprovedItemId, selectedSupplierId: supplierAId }] });
 
    expect(issueRes.status).toBe(400);
    expect(issueRes.body.message).toContain('purchase-request-not-approved-yet');
  });
 
  it('NFR Performance: tạo PR → sign → approve → issue-po phải hoàn tất trong ≤3 giây', async () => {
    const PERFORMANCE_THRESHOLD_MS = 3000;
    const startedAt = Date.now();
 
    const createRes = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(authHeader())
      .send({
        departmentId,
        purposeOfUse: 'Test performance NFR',
        items: [
          {
            itemName: 'Vật tư test performance',
            quantity: 1,
            quotations: [
              { supplierId: supplierAId, quotedAmount: 300000 },
              { supplierId: supplierBId, quotedAmount: 280000 },
            ],
          },
        ],
      });
    expect(createRes.status).toBe(201);
    const perfPrId = createRes.body.result.id;
 
    const getRes = await request(app.getHttpServer())
      .get(`/purchase-requests/${perfPrId}`)
      .set(authHeader());
    const perfItemId = getRes.body.items[0].id;
 
    await request(app.getHttpServer())
      .post(`/purchase-requests/${perfPrId}/sign`)
      .set(authHeader())
      .attach('file', Buffer.from('%PDF-1.4 fake signature perf'), 'sig-perf.pdf')
      .expect(201);
 
    await request(app.getHttpServer())
      .put(`/purchase-requests/${perfPrId}/approve`)
      .set(authHeader())
      .expect(200);
 
    await request(app.getHttpServer())
      .post(`/purchase-requests/${perfPrId}/issue-po`)
      .set(authHeader())
      .send({ selections: [{ itemId: perfItemId, selectedSupplierId: supplierAId }] })
      .expect(201);
 
    const elapsedMs = Date.now() - startedAt;
 
    const envInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version,
      measuredAt: new Date().toISOString(),
      elapsedMs,
      thresholdMs: PERFORMANCE_THRESHOLD_MS,
      withinThreshold: elapsedMs <= PERFORMANCE_THRESHOLD_MS,
    };
    console.log('[NFR Performance Report]', JSON.stringify(envInfo, null, 2));
 
    if (elapsedMs > PERFORMANCE_THRESHOLD_MS) {
      console.warn(
        `VƯỢT NGƯỠNG NFR: luồng tạo PR → sign → approve → issue-po mất ${elapsedMs}ms ` +
          `(ngưỡng cho phép: ${PERFORMANCE_THRESHOLD_MS}ms). Xem [NFR Performance Report] ở trên ` +
          `để biết môi trường đo (host, platform, thời điểm) phục vụ điều tra nguyên nhân.`,
      );
    }
 
    expect(elapsedMs).toBeLessThanOrEqual(PERFORMANCE_THRESHOLD_MS);
  });


});