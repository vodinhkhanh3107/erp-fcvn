import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { KpiService } from './kpi.service';
import { Kpi, KpiStatus } from '../../models/kpi.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
});

describe('KpiService', () => {
  let service: KpiService;
  let repository: MockRepository<Kpi>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: getRepositoryToken(Kpi),
          useValue: createMockRepository<Kpi>(),
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    repository = module.get(getRepositoryToken(Kpi));
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
      } as any;

      const createdEntity = {
        ...dto,
        kpiStatus: KpiStatus.ON_TRACK,
        createdBy: actorId,
        updatedBy: actorId,
      };
      const savedEntity = { id: 1, ...createdEntity };

      (repository.create as jest.Mock).mockReturnValue(createdEntity);
      (repository.save as jest.Mock).mockResolvedValue(savedEntity);

      const result = await service.create(dto, actorId);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        kpiStatus: KpiStatus.ON_TRACK,
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
      } as any;

      (repository.create as jest.Mock).mockImplementation((data) => data);
      (repository.save as jest.Mock).mockImplementation(async (entity) => ({
        id: 2,
        ...entity,
      }));

      const result = await service.create(dto, actorId);

      expect(result.result.kpiStatus).toBe(KpiStatus.ON_TRACK);
    });

    it('nên set kpiStatus = OFF_TRACK khi actualValue < targetValue', async () => {
      const dto = {
        userId: 10,
        period: '2026-08',
        targetValue: 100,
        actualValue: 80,
      } as any;

      (repository.create as jest.Mock).mockImplementation((data) => data);
      (repository.save as jest.Mock).mockImplementation(async (entity) => ({
        id: 3,
        ...entity,
      }));

      const result = await service.create(dto, actorId);

      expect(result.result.kpiStatus).toBe(KpiStatus.OFF_TRACK);
    });
  });

  describe('findAll', () => {
    it('nên trả về danh sách KPI kèm phân trang, không filter khi query rỗng', async () => {
      const query = { page: 1, limit: 10 } as any;
      const items = [{ id: 1, period: '2026-08' }];

      (repository.findAndCount as jest.Mock).mockResolvedValue([items, 1]);

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
      const query = { page: 1, limit: 10, userId: 5, period: '2026-08' } as any;

      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

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
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('kpi-not-found');
    });

    it('nên trả về KPI kèm relation user khi tìm thấy', async () => {
      const kpi = { id: 1, period: '2026-08', user: { id: 5, fullName: 'Nhân viên A' } };
      (repository.findOne as jest.Mock).mockResolvedValue(kpi);

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
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateActual(999, { actualValue: 50 } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên cập nhật actualValue, tính lại kpiStatus, và gán updatedBy', async () => {
      const existingKpi = {
        id: 1,
        targetValue: '100', // giả lập decimal trả về dạng string từ MySQL, giống thực tế
        actualValue: 50,
        kpiStatus: KpiStatus.OFF_TRACK,
        updatedBy: 1,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(existingKpi);
      (repository.save as jest.Mock).mockImplementation(async (entity) => entity);

      const actorId = 20;
      const dto = { actualValue: 150 } as any;

      const result = await service.updateActual(1, dto, actorId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          actualValue: 150,
          kpiStatus: KpiStatus.ON_TRACK,
          updatedBy: actorId,
        }),
      );
      expect(result).toEqual({
        message: 'Cập nhật KPI thành công',
        result: expect.objectContaining({
          actualValue: 150,
          kpiStatus: KpiStatus.ON_TRACK,
        }),
      });
    });

    it('nên chuyển kpiStatus sang OFF_TRACK nếu actualValue mới thấp hơn targetValue', async () => {
      const existingKpi = {
        id: 1,
        targetValue: '100',
        actualValue: 120,
        kpiStatus: KpiStatus.ON_TRACK,
        updatedBy: 1,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(existingKpi);
      (repository.save as jest.Mock).mockImplementation(async (entity) => entity);

      const dto = { actualValue: 60 } as any;

      const result = await service.updateActual(1, dto, 20);

      expect(result.result.kpiStatus).toBe(KpiStatus.OFF_TRACK);
    });
  });
});
