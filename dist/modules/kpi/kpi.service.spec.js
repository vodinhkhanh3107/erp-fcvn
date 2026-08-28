"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const kpi_service_1 = require("./kpi.service");
const kpi_entity_1 = require("../../models/kpi.entity");
const createMockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
});
describe('KpiService', () => {
    let service;
    let repository;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                kpi_service_1.KpiService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(kpi_entity_1.Kpi),
                    useValue: createMockRepository(),
                },
            ],
        }).compile();
        service = module.get(kpi_service_1.KpiService);
        repository = module.get((0, typeorm_1.getRepositoryToken)(kpi_entity_1.Kpi));
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('nên được định nghĩa', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        const actorId = 1;
        it('nên set kpiStatus = ON_TRACK khi actualValue >= targetValue', async () => {
            const dto = {
                userId: 10,
                period: '2026-08',
                targetValue: 100,
                actualValue: 120,
            };
            const createdEntity = {
                ...dto,
                kpiStatus: kpi_entity_1.KpiStatus.ON_TRACK,
                createdBy: actorId,
                updatedBy: actorId,
            };
            const savedEntity = { id: 1, ...createdEntity };
            repository.create.mockReturnValue(createdEntity);
            repository.save.mockResolvedValue(savedEntity);
            const result = await service.create(dto, actorId);
            expect(repository.create).toHaveBeenCalledWith({
                ...dto,
                kpiStatus: kpi_entity_1.KpiStatus.ON_TRACK,
                createdBy: actorId,
                updatedBy: actorId,
            });
            expect(result).toEqual({
                message: 'Tạo KPI thành công',
                result: savedEntity,
            });
        });
        it('nên set kpiStatus = ON_TRACK khi actualValue đúng bằng targetValue (biên)', async () => {
            const dto = {
                userId: 10,
                period: '2026-08',
                targetValue: 100,
                actualValue: 100,
            };
            repository.create.mockImplementation((data) => data);
            repository.save.mockImplementation(async (entity) => ({
                id: 2,
                ...entity,
            }));
            const result = await service.create(dto, actorId);
            expect(result.result.kpiStatus).toBe(kpi_entity_1.KpiStatus.ON_TRACK);
        });
        it('nên set kpiStatus = OFF_TRACK khi actualValue < targetValue', async () => {
            const dto = {
                userId: 10,
                period: '2026-08',
                targetValue: 100,
                actualValue: 80,
            };
            repository.create.mockImplementation((data) => data);
            repository.save.mockImplementation(async (entity) => ({
                id: 3,
                ...entity,
            }));
            const result = await service.create(dto, actorId);
            expect(result.result.kpiStatus).toBe(kpi_entity_1.KpiStatus.OFF_TRACK);
        });
    });
    describe('findAll', () => {
        it('nên trả về danh sách KPI kèm phân trang, không filter khi query rỗng', async () => {
            const query = { page: 1, limit: 10 };
            const items = [{ id: 1, period: '2026-08' }];
            repository.findAndCount.mockResolvedValue([items, 1]);
            const result = await service.findAll(query);
            expect(repository.findAndCount).toHaveBeenCalledWith({
                where: {},
                relations: { user: true },
                order: { period: 'DESC' },
                skip: 0,
                take: 10,
            });
            expect(result).toEqual({
                items,
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            });
        });
        it('nên áp dụng filter userId và period khi được truyền vào query', async () => {
            const query = { page: 1, limit: 10, userId: 5, period: '2026-08' };
            repository.findAndCount.mockResolvedValue([[], 0]);
            await service.findAll(query);
            expect(repository.findAndCount).toHaveBeenCalledWith({
                where: { userId: 5, period: '2026-08' },
                relations: { user: true },
                order: { period: 'DESC' },
                skip: 0,
                take: 10,
            });
        });
    });
    describe('findOne', () => {
        it('nên throw NotFoundException khi không tìm thấy KPI', async () => {
            repository.findOne.mockResolvedValue(null);
            await expect(service.findOne(999)).rejects.toThrow(common_1.NotFoundException);
            await expect(service.findOne(999)).rejects.toThrow('kpi-not-found');
        });
        it('nên trả về KPI kèm relation user khi tìm thấy', async () => {
            const kpi = { id: 1, period: '2026-08', user: { id: 5, fullName: 'Nhân viên A' } };
            repository.findOne.mockResolvedValue(kpi);
            const result = await service.findOne(1);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: { user: true },
            });
            expect(result).toEqual(kpi);
        });
    });
    describe('updateActual', () => {
        it('nên throw NotFoundException nếu KPI không tồn tại', async () => {
            repository.findOne.mockResolvedValue(null);
            await expect(service.updateActual(999, { actualValue: 50 }, 1)).rejects.toThrow(common_1.NotFoundException);
        });
        it('nên cập nhật actualValue, tính lại kpiStatus, và gán updatedBy', async () => {
            const existingKpi = {
                id: 1,
                targetValue: '100',
                actualValue: 50,
                kpiStatus: kpi_entity_1.KpiStatus.OFF_TRACK,
                updatedBy: 1,
            };
            repository.findOne.mockResolvedValue(existingKpi);
            repository.save.mockImplementation(async (entity) => entity);
            const actorId = 20;
            const dto = { actualValue: 150 };
            const result = await service.updateActual(1, dto, actorId);
            expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
                actualValue: 150,
                kpiStatus: kpi_entity_1.KpiStatus.ON_TRACK,
                updatedBy: actorId,
            }));
            expect(result).toEqual({
                message: 'Cập nhật KPI thành công',
                result: expect.objectContaining({
                    actualValue: 150,
                    kpiStatus: kpi_entity_1.KpiStatus.ON_TRACK,
                }),
            });
        });
        it('nên chuyển kpiStatus sang OFF_TRACK nếu actualValue mới thấp hơn targetValue', async () => {
            const existingKpi = {
                id: 1,
                targetValue: '100',
                actualValue: 120,
                kpiStatus: kpi_entity_1.KpiStatus.ON_TRACK,
                updatedBy: 1,
            };
            repository.findOne.mockResolvedValue(existingKpi);
            repository.save.mockImplementation(async (entity) => entity);
            const dto = { actualValue: 60 };
            const result = await service.updateActual(1, dto, 20);
            expect(result.result.kpiStatus).toBe(kpi_entity_1.KpiStatus.OFF_TRACK);
        });
    });
});
//# sourceMappingURL=kpi.service.spec.js.map