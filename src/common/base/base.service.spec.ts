import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from './base.service';


interface FakeEntity {
  id: number;
  name: string;
}

describe('BaseService', () => {
  // Khai báo sẵn ở ngoài để mọi it() bên trong đều dùng chung được
  let service: BaseService<FakeEntity>;
  let mockRepository: Partial<Record<keyof Repository<FakeEntity>, jest.Mock>>;

  beforeEach(() => {
    // Tạo lại 1 bộ mock HOÀN TOÀN MỚI trước mỗi bài test — đây là "Repository giả",
    // thay thế cho Repository<FakeEntity> thật của TypeORM (không cần MySQL thật).
    mockRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    // "as unknown as Repository<FakeEntity>" — ép kiểu để TypeScript chấp nhận mock này
    // đóng vai trò 1 Repository thật (mock chỉ cần đủ method mà BaseService THỰC SỰ gọi tới).
    service = new BaseService<FakeEntity>(mockRepository as unknown as Repository<FakeEntity>, ['name']);
  });

  describe('findAll()', () => {
    it('không có keyword → gọi findAndCount với where = undefined', async () => {
      // Sắp đặt (Arrange): quy định repository giả trả về gì khi bị gọi
      mockRepository.findAndCount.mockResolvedValue([[{ id: 1, name: 'A' }], 1]);

      // Hành động (Act): gọi hàm thật cần test
      const result = await service.findAll({ page: 1, limit: 10 });

      // Kiểm tra (Assert)
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined, skip: 0, take: 10 }),
      );
      expect(result.items).toEqual([{ id: 1, name: 'A' }]);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('có keyword → xây where theo đúng searchableFields đã khai (["name"])', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, keyword: 'abc' });

      const callArgs = mockRepository.findAndCount.mock.calls[0][0]; // tham số đầu tiên của lần gọi đầu tiên
      expect(callArgs.where).toHaveLength(1); // đúng 1 field "name" trong searchableFields
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

      // Vì findOne() là async và sẽ throw, phải dùng cú pháp .rejects.toThrow() thay vì gọi thường
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('gọi repository.create() rồi repository.save(), trả về kết quả đã lưu', async () => {
      const dto = { name: 'New Item' };
      const createdEntity = { id: 1, name: 'New Item' }; // giả lập repository.create() gán thêm id
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
      mockRepository.findOne.mockResolvedValue(existing); // update() gọi findOne() nội bộ trước
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name'); // xác nhận Object.assign() đã gộp đúng field mới
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

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});




