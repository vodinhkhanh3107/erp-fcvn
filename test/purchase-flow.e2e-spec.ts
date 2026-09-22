import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { FILE_STORAGE_SERVICE, IFileStorageService } from 'src/common/file-storage/file-storage.interface';

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
});