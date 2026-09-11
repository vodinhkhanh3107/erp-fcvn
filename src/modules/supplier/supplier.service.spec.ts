import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { SupplierService } from './supplier.service';
import { Supplier } from '../../models/supplier.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  softDelete: jest.fn(),
  findOneBy: jest.fn(),
});

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: MockRepository<Supplier>;

  beforeEach(async () => {
    repository = createMockRepository<Supplier>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  describe('createSupplier', () => {
    const actorId = 1;
    const dto = {
      name: 'Công ty ABC',
      taxCode: '0123456789',
      contactEmail: 'contact@abc.com',
    } as any;

    it('nên throw ConflictException nếu taxCode đã tồn tại, KHÔNG check tiếp email', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });

      let thrownError: any;
      try {
        await service.createSupplier(dto, actorId);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('tax-code-already-exists');
    });

    it('nên throw ConflictException nếu contactEmail đã tồn tại (sau khi taxCode hợp lệ)', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail });

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(repository.findOne).toHaveBeenNthCalledWith(1, { where: { taxCode: dto.taxCode } });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: { contactEmail: dto.contactEmail },
      });
    });

    it('nên tạo supplier thành công khi taxCode và contactEmail đều chưa tồn tại', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const savedSupplier = { id: 10, ...dto, createdBy: actorId, updatedBy: actorId };
      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(savedSupplier as any);

      const result = await service.createSupplier(dto, actorId);

      expect(createSpy).toHaveBeenCalledWith({
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      });
      expect(result).toEqual({
        message: 'Tạo nhà cung cấp thành công',
        result: savedSupplier,
      });
    });

    it('không nên gọi this.create nếu taxCode đã trùng', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, taxCode: dto.taxCode });
      const createSpy = jest.spyOn(service, 'create');

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('không nên gọi this.create nếu contactEmail đã trùng', async () => {
      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, contactEmail: dto.contactEmail });
      const createSpy = jest.spyOn(service, 'create');

      await expect(service.createSupplier(dto, actorId)).rejects.toThrow(ConflictException);

      expect(createSpy).not.toHaveBeenCalled();
    });
  });
  describe('updateSupplier', () => {
    const id = 1;
    const existedSupplier = { id, name: 'Công ty cũ', taxCode: '111', contactEmail: 'old@abc.com' };

    it('nên throw NotFoundException nếu supplier không tồn tại', async () => {
      // Existence check giờ dùng findOneBy({ id }) — KHÔNG phải findOne({ where: { taxCode } })
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.updateSupplier(999, {} as any)).rejects.toThrow(NotFoundException);
      await expect(service.updateSupplier(999, {} as any)).rejects.toThrow('not-found-supplier');

      // Không được đi tới bước check trùng taxCode/email khi supplier gốc còn không tồn tại
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('KHÔNG nên check trùng taxCode/email nếu dto không truyền field đó (chỉ sửa field khác)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue({
        ...existedSupplier,
        name: 'Tên mới',
      } as any);

      const dto = { name: 'Tên mới' } as any; // không có taxCode, không có contactEmail

      await service.updateSupplier(id, dto);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(id, dto);
    });

    it('nên throw ConflictException nếu taxCode mới trùng với supplier KHÁC (không phải chính nó)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValueOnce({ id: 99, taxCode: '222' }); // trùng ở supplier khác

      const dto = { taxCode: '222' } as any;

      let thrownError: any;
      try {
        await service.updateSupplier(id, dto);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('tax-code-already-exists');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: Not(id), taxCode: '222' },
      });
    });

    it('KHÔNG nên throw nếu taxCode không đổi (trùng với chính bản thân supplier đang sửa)', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      // findOne dùng Not(id) nên sẽ không bao giờ trả về chính record đang sửa — mock đúng hành vi này: null
      (repository.findOne as jest.Mock).mockResolvedValueOnce(null);
      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(existedSupplier as any);

      const dto = { taxCode: existedSupplier.taxCode } as any; // giữ nguyên taxCode cũ

      await expect(service.updateSupplier(id, dto)).resolves.toEqual({
        message: 'Cập nhật nhà cung cấp thành công',
        result: existedSupplier,
      });
      expect(updateSpy).toHaveBeenCalledWith(id, dto);
    });

    it('nên throw ConflictException nếu contactEmail mới trùng với supplier khác', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      // dto chỉ có contactEmail, KHÔNG có taxCode → nhánh check taxCode bị bỏ qua hoàn toàn,
      // nên findOne chỉ được gọi ĐÚNG 1 LẦN (cho việc check contactEmail), không phải 2 lần.
      (repository.findOne as jest.Mock).mockResolvedValueOnce({
        id: 50,
        contactEmail: 'trung@abc.com',
      });

      const dto = { contactEmail: 'trung@abc.com' } as any;

      let thrownError: any;
      try {
        await service.updateSupplier(id, dto);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ConflictException);
      expect(thrownError.message).toBe('email-already-exists');
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });

    it('nên cập nhật thành công khi taxCode và contactEmail đều không trùng', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existedSupplier);
      (repository.findOne as jest.Mock).mockResolvedValue(null); // cả 2 lần check đều không trùng

      const dto = { taxCode: '999', contactEmail: 'new@abc.com' } as any;
      const updatedSupplier = { ...existedSupplier, ...dto };
      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(updatedSupplier as any);

      const result = await service.updateSupplier(id, dto);

      expect(repository.findOne).toHaveBeenCalledTimes(2); // 1 lần check taxCode, 1 lần check email
      expect(updateSpy).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({
        message: 'Cập nhật nhà cung cấp thành công',
        result: updatedSupplier,
      });
    });
  });
});
