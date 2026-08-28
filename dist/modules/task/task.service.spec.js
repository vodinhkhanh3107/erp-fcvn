"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
const task_entity_1 = require("../../models/task.entity");
const createMockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
});
describe('TaskService', () => {
    let service;
    let repository;
    const FIXED_TODAY = new Date('2026-08-27T00:00:00.000Z');
    beforeEach(async () => {
        jest.useFakeTimers().setSystemTime(FIXED_TODAY);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                task_service_1.TaskService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(task_entity_1.Task),
                    useValue: createMockRepository(),
                },
            ],
        }).compile();
        service = module.get(task_service_1.TaskService);
        repository = module.get((0, typeorm_1.getRepositoryToken)(task_entity_1.Task));
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });
    it('nên được định nghĩa', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        const actorId = 10;
        it('nên throw BadRequestException nếu deadline nằm trong quá khứ', async () => {
            const dto = {
                taskName: 'Task test',
                deadline: '2026-08-01',
                assignedTo: 1,
            };
            await expect(service.create(dto, actorId)).rejects.toThrow(common_1.BadRequestException);
            await expect(service.create(dto, actorId)).rejects.toThrow('deadline-must-not-be-in-the-past');
            expect(repository.create).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
        });
        it('nên tạo task thành công khi deadline hợp lệ (hôm nay hoặc tương lai)', async () => {
            const dto = {
                taskName: 'Task test',
                deadline: '2026-08-27',
                assignedTo: 1,
            };
            const createdEntity = { ...dto, createdBy: actorId, updatedBy: actorId };
            const savedEntity = { id: 1, ...createdEntity };
            repository.create.mockReturnValue(createdEntity);
            repository.save.mockResolvedValue(savedEntity);
            const result = await service.create(dto, actorId);
            expect(repository.create).toHaveBeenCalledWith({
                ...dto,
                createdBy: actorId,
                updatedBy: actorId,
            });
            expect(repository.save).toHaveBeenCalledWith(createdEntity);
            expect(result).toEqual({
                message: 'Tạo công việc thành công',
                result: savedEntity,
            });
        });
        it('nên tạo task thành công khi deadline ở tương lai', async () => {
            const dto = {
                taskName: 'Task tương lai',
                deadline: '2026-09-01',
                assignedTo: 2,
            };
            const createdEntity = { ...dto, createdBy: actorId, updatedBy: actorId };
            const savedEntity = { id: 2, ...createdEntity };
            repository.create.mockReturnValue(createdEntity);
            repository.save.mockResolvedValue(savedEntity);
            const result = await service.create(dto, actorId);
            expect(result.result).toEqual(savedEntity);
        });
    });
    describe('findAll', () => {
        it('nên trả về danh sách task kèm phân trang, không filter khi query rỗng', async () => {
            const query = { page: 1, limit: 10 };
            const items = [{ id: 1, taskName: 'Task A' }];
            repository.findAndCount.mockResolvedValue([items, 1]);
            const result = await service.findAll(query);
            expect(repository.findAndCount).toHaveBeenCalledWith({
                where: {},
                relations: { assignee: true },
                order: { deadline: 'ASC' },
                skip: 0,
                take: 10,
            });
            expect(result).toEqual({
                items,
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            });
        });
        it('nên áp dụng filter assignedTo và status khi được truyền vào query', async () => {
            const query = { page: 2, limit: 5, assignedTo: 3, status: 'IN_PROGRESS' };
            repository.findAndCount.mockResolvedValue([[], 0]);
            await service.findAll(query);
            expect(repository.findAndCount).toHaveBeenCalledWith({
                where: { assignedTo: 3, status: 'IN_PROGRESS' },
                relations: { assignee: true },
                order: { deadline: 'ASC' },
                skip: 5,
                take: 5,
            });
        });
        it('nên tính đúng totalPages khi total không chia hết cho limit', async () => {
            const query = { page: 1, limit: 10 };
            repository.findAndCount.mockResolvedValue([[], 25]);
            const result = await service.findAll(query);
            expect(result.meta.totalPages).toBe(3);
        });
    });
    describe('findOne', () => {
        it('nên throw NotFoundException khi không tìm thấy task', async () => {
            repository.findOne.mockResolvedValue(null);
            await expect(service.findOne(999)).rejects.toThrow(common_1.NotFoundException);
            await expect(service.findOne(999)).rejects.toThrow('task-not-found');
        });
        it('nên trả về task kèm relation assignee khi tìm thấy', async () => {
            const task = { id: 1, taskName: 'Task A', assignee: { id: 5, fullName: 'Nhân viên A' } };
            repository.findOne.mockResolvedValue(task);
            const result = await service.findOne(1);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: { assignee: true },
            });
            expect(result).toEqual(task);
        });
    });
    describe('updateStatus', () => {
        it('nên throw NotFoundException nếu task không tồn tại', async () => {
            repository.findOne.mockResolvedValue(null);
            await expect(service.updateStatus(999, { status: 'DONE' }, 10)).rejects.toThrow(common_1.NotFoundException);
        });
        it('nên cập nhật status và updatedBy, rồi lưu lại', async () => {
            const existingTask = { id: 1, taskName: 'Task A', status: 'TODO', updatedBy: 1 };
            repository.findOne.mockResolvedValue(existingTask);
            repository.save.mockImplementation(async (entity) => entity);
            const actorId = 20;
            const dto = { status: 'DONE' };
            const result = await service.updateStatus(1, dto, actorId);
            expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 1, status: 'DONE', updatedBy: actorId }));
            expect(result).toEqual({
                message: 'Cập nhật trạng thái công việc thành công',
                result: expect.objectContaining({ status: 'DONE', updatedBy: actorId }),
            });
        });
    });
});
//# sourceMappingURL=task.service.spec.js.map