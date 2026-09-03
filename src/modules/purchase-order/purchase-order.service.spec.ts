import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../../models/purchase-order.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
});

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let repository: MockRepository<PurchaseOrder>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: createMockRepository<PurchaseOrder>(),
        },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
    repository = module.get(getRepositoryToken(PurchaseOrder));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('nên trả về danh sách kèm phân trang, không filter khi query rỗng', async () => {
      const query = { page: 1, limit: 10 } as any;
      const items = [{ id: 1, totalAmount: 1000000 }];

      (repository.findAndCount as jest.Mock).mockResolvedValue([items, 1]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { supplier: true, items: true },
        order: { id: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('nên áp dụng filter supplierId và status khi được truyền vào query', async () => {
      const query = {
        page: 2,
        limit: 5,
        supplierId: 3,
        status: PurchaseOrderStatus.RELEASED,
      } as any;

      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { supplierId: 3, status: PurchaseOrderStatus.RELEASED },
        relations: { supplier: true, items: true },
        order: { id: 'DESC' },
        skip: 5, 
        take: 5,
      });
    });

    it('chỉ nên áp dụng filter supplierId khi status không được truyền', async () => {
      const query = { page: 1, limit: 10, supplierId: 7 } as any;

      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { supplierId: 7 } }),
      );
    });

    it('nên tính đúng totalPages khi total không chia hết cho limit', async () => {
      const query = { page: 1, limit: 10 } as any;

      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 23]);

      const result = await service.findAll(query);

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('nên throw NotFoundException khi không tìm thấy purchase order', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('purchase-order-not-found');
    });

    it('nên trả về purchase order kèm relations supplier và items khi tìm thấy', async () => {
      const po = {
        id: 1,
        totalAmount: 5000000,
        supplier: { id: 1, name: 'Công ty ABC' },
        items: [{ id: 1, itemName: 'Màn hình', quantity: 2 }],
      };
      (repository.findOne as jest.Mock).mockResolvedValue(po);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { supplier: true, items: true },
      });
      expect(result).toEqual(po);
    });
  });
});