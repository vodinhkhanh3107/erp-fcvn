"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const testing_1 = require("@nestjs/testing");
const supplier_entity_1 = require("../../models/supplier.entity");
const supplier_group_entity_1 = require("../../models/supplier-group.entity");
const supplier_group_service_1 = require("./supplier-group.service");
describe('SupplierGroupService', () => {
    let service;
    let mockGroupRepo;
    let mockSupplierRepo;
    const fakeGroup = {
        id: 1,
        code: 'SUP-001',
        name: 'Nhóm NCC Vé máy bay',
        status: supplier_group_entity_1.SupplierGroupStatus.ACTIVE,
    };
    beforeEach(async () => {
        mockGroupRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        mockSupplierRepo = {
            findBy: jest.fn(),
            update: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                supplier_group_service_1.SupplierGroupService,
                { provide: (0, typeorm_1.getRepositoryToken)(supplier_group_entity_1.SupplierGroup), useValue: mockGroupRepo },
                { provide: (0, typeorm_1.getRepositoryToken)(supplier_entity_1.Supplier), useValue: mockSupplierRepo },
            ],
        }).compile();
        service = module.get(supplier_group_service_1.SupplierGroupService);
    });
    afterEach(() => jest.clearAllMocks());
    describe('createGroup() — quy tắc "code duy nhất"', () => {
        it('code đã tồn tại → ném ConflictException', async () => {
            mockGroupRepo.findOne.mockResolvedValue(fakeGroup);
            await expect(service.createGroup({ code: 'SUP-001', name: 'B' }, 1)).rejects.toThrow(common_1.ConflictException);
        });
        it('code chưa tồn tại → tạo thành công, lưu đúng createdBy/updatedBy', async () => {
            mockGroupRepo.findOne.mockResolvedValue(null);
            mockGroupRepo.create.mockReturnValue(fakeGroup);
            mockGroupRepo.save.mockResolvedValue(fakeGroup);
            const result = await service.createGroup({ code: 'SUP-001', name: 'Nhóm A' }, 99);
            expect(mockGroupRepo.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'SUP-001', createdBy: 99, updatedBy: 99 }));
            expect(result.message).toBe('Tạo nhóm NCC thành công');
        });
    });
    describe('updateStatus() — quy tắc "ngừng sử dụng = chuyển INACTIVE"', () => {
        it('trạng thái mới GIỐNG trạng thái cũ → ném BadRequestException', async () => {
            mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
            await expect(service.updateStatus(1, { status: supplier_group_entity_1.SupplierGroupStatus.ACTIVE }, 1)).rejects.toThrow(common_1.BadRequestException);
        });
        it('trạng thái mới KHÁC → đổi thành công', async () => {
            mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
            mockGroupRepo.save.mockImplementation((e) => Promise.resolve(e));
            const result = await service.updateStatus(1, { status: supplier_group_entity_1.SupplierGroupStatus.INACTIVE }, 1);
            expect(result.result.status).toBe(supplier_group_entity_1.SupplierGroupStatus.INACTIVE);
        });
    });
    describe('assignSuppliers() — quy tắc "gán NCC vào nhóm"', () => {
        it('nhóm không tồn tại → ném lỗi (kế thừa từ findOne() của BaseService)', async () => {
            mockGroupRepo.findOne.mockResolvedValue(null);
            await expect(service.assignSuppliers(999, { supplierIds: [1, 2] }, 1)).rejects.toThrow();
        });
        it('nhóm đang INACTIVE → ném BadRequestException, KHÔNG được gán', async () => {
            mockGroupRepo.findOne.mockResolvedValue({
                ...fakeGroup,
                status: supplier_group_entity_1.SupplierGroupStatus.INACTIVE,
            });
            await expect(service.assignSuppliers(1, { supplierIds: [1, 2] }, 1)).rejects.toThrow(common_1.BadRequestException);
            expect(mockSupplierRepo.update).not.toHaveBeenCalled();
        });
        it('có supplierId không tồn tại trong DB → ném BadRequestException', async () => {
            mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
            mockSupplierRepo.findBy.mockResolvedValue([{ id: 1 }]);
            await expect(service.assignSuppliers(1, { supplierIds: [1, 2] }, 1)).rejects.toThrow(common_1.BadRequestException);
            expect(mockSupplierRepo.update).not.toHaveBeenCalled();
        });
        it('mọi supplierId hợp lệ + nhóm ACTIVE → gán thành công', async () => {
            mockGroupRepo.findOne.mockResolvedValue({ ...fakeGroup });
            mockSupplierRepo.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
            mockSupplierRepo.update.mockResolvedValue(undefined);
            const result = await service.assignSuppliers(1, { supplierIds: [1, 2] }, 1);
            expect(mockSupplierRepo.update).toHaveBeenCalledWith([1, 2], { groupId: 1, updatedBy: 1 });
            expect(result.message).toContain('Đã gán 2 nhà cung cấp');
        });
    });
});
//# sourceMappingURL=supplier-group.service.spec.js.map