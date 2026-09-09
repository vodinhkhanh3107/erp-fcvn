"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const base_service_1 = require("./base.service");
describe('BaseService', () => {
    let service;
    let mockRepository;
    beforeEach(() => {
        mockRepository = {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
        };
        service = new base_service_1.BaseService(mockRepository, [
            'name',
        ]);
    });
    describe('findAll()', () => {
        it('không có keyword → gọi findAndCount với where = undefined', async () => {
            mockRepository.findAndCount.mockResolvedValue([[{ id: 1, name: 'A' }], 1]);
            const result = await service.findAll({ page: 1, limit: 10 });
            expect(mockRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: undefined, skip: 0, take: 10 }));
            expect(result.items).toEqual([{ id: 1, name: 'A' }]);
            expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
        });
        it('có keyword → xây where theo đúng searchableFields đã khai (["name"])', async () => {
            mockRepository.findAndCount.mockResolvedValue([[], 0]);
            await service.findAll({ page: 1, limit: 10, keyword: 'abc' });
            const callArgs = mockRepository.findAndCount.mock.calls[0][0];
            expect(callArgs.where).toHaveLength(1);
        });
    });
    describe('findOne()', () => {
        it('tìm thấy → trả về entity', async () => {
            const fakeEntity = { id: 1, name: 'A' };
            mockRepository.findOne.mockResolvedValue(fakeEntity);
            const result = await service.findOne(1);
            expect(result).toEqual(fakeEntity);
        });
        it('KHÔNG tìm thấy → ném NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne(999)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('create()', () => {
        it('gọi repository.create() rồi repository.save(), trả về kết quả đã lưu', async () => {
            const dto = { name: 'New Item' };
            const createdEntity = { id: 1, name: 'New Item' };
            mockRepository.create.mockReturnValue(createdEntity);
            mockRepository.save.mockResolvedValue(createdEntity);
            const result = await service.create(dto);
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
            expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
            expect(result).toEqual(createdEntity);
        });
    });
    describe('update()', () => {
        it('lấy entity hiện có, gộp dữ liệu mới, rồi lưu lại', async () => {
            const existing = { id: 1, name: 'Old Name' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));
            const result = await service.update(1, { name: 'New Name' });
            expect(result.name).toBe('New Name');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
    describe('remove()', () => {
        it('xác nhận tồn tại rồi mới gọi softDelete()', async () => {
            mockRepository.findOne.mockResolvedValue({ id: 1, name: 'A' });
            await service.remove(1);
            expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
        });
        it('nếu id không tồn tại → ném lỗi, KHÔNG được gọi softDelete()', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.remove(999)).rejects.toThrow(common_1.NotFoundException);
            expect(mockRepository.softDelete).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=base.service.spec.js.map