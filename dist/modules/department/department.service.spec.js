"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const department_service_1 = require("./department.service");
const department_entity_1 = require("../../models/department.entity");
describe('DepartmentService', () => {
    let service;
    let repository;
    beforeEach(async () => {
        repository = {};
        const module = await testing_1.Test.createTestingModule({
            providers: [
                department_service_1.DepartmentService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(department_entity_1.Department),
                    useValue: repository,
                },
            ],
        }).compile();
        service = module.get(department_service_1.DepartmentService);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('nên được định nghĩa', () => {
        expect(service).toBeDefined();
    });
    describe('createDepartment', () => {
        it('nên gọi this.create với đầy đủ dto + createdBy + updatedBy, và trả về message đúng', async () => {
            const dto = { name: 'Phòng Kỹ thuật' };
            const actorId = 5;
            const savedDepartment = { id: 1, ...dto, createdBy: actorId, updatedBy: actorId };
            const createSpy = jest.spyOn(service, 'create').mockResolvedValue(savedDepartment);
            const result = await service.createDepartment(dto, actorId);
            expect(createSpy).toHaveBeenCalledWith({
                ...dto,
                createdBy: actorId,
                updatedBy: actorId,
            });
            expect(result).toEqual({
                message: 'Tạo phòng ban thành công',
                result: savedDepartment,
            });
        });
    });
    describe('updateDepartment', () => {
        it('nên gọi this.update với id, dto + updatedBy, và trả về message đúng', async () => {
            const id = 1;
            const dto = { name: 'Phòng Kỹ thuật (đổi tên)' };
            const actorId = 7;
            const updatedDepartment = { id, ...dto, updatedBy: actorId };
            const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(updatedDepartment);
            const result = await service.updateDepartment(id, dto, actorId);
            expect(updateSpy).toHaveBeenCalledWith(id, { ...dto, updatedBy: actorId });
            expect(result).toEqual({
                message: 'Cập nhật phòng ban thành công',
                result: updatedDepartment,
            });
        });
    });
    describe('updateStatus', () => {
        const id = 1;
        const actorId = 9;
        it('nên throw BadRequestException nếu status mới giống status hiện tại', async () => {
            const existingDepartment = { id, status: 'active' };
            jest.spyOn(service, 'findOne').mockResolvedValue(existingDepartment);
            const updateSpy = jest.spyOn(service, 'update');
            const dto = { status: 'active' };
            await expect(service.updateStatus(id, dto, actorId)).rejects.toThrow(common_1.BadRequestException);
            await expect(service.updateStatus(id, dto, actorId)).rejects.toThrow('status-not-changed');
            expect(updateSpy).not.toHaveBeenCalled();
        });
        it('nên cập nhật thành công khi status mới khác status hiện tại', async () => {
            const existingDepartment = { id, status: 'active' };
            const updatedDepartment = { id, status: 'inactive', updatedBy: actorId };
            jest.spyOn(service, 'findOne').mockResolvedValue(existingDepartment);
            const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(updatedDepartment);
            const dto = { status: 'inactive' };
            const result = await service.updateStatus(id, dto, actorId);
            expect(updateSpy).toHaveBeenCalledWith(id, {
                status: 'inactive',
                updatedBy: actorId,
            });
            expect(result).toEqual({
                message: 'Cập nhật trạng thái thành công',
                result: updatedDepartment,
            });
        });
    });
    describe('list', () => {
        it('nên gọi this.findAll với đúng query và trả về nguyên kết quả', async () => {
            const query = { page: 1, limit: 10 };
            const expectedResult = {
                items: [{ id: 1, name: 'Phòng Kỹ thuật' }],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
            const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);
            const result = await service.list(query);
            expect(findAllSpy).toHaveBeenCalledWith(query);
            expect(result).toEqual(expectedResult);
        });
    });
});
//# sourceMappingURL=department.service.spec.js.map