import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DepartmentService } from './department.service';
import { Department } from '../../models/department.entity';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let repository: Partial<Record<keyof Repository<Department>, jest.Mock>>;

  beforeEach(async () => {
    repository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: getRepositoryToken(Department),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  describe('createDepartment', () => {
    it('nên gọi this.create với đầy đủ dto + createdBy + updatedBy, và trả về message đúng', async () => {
      const dto = { name: 'Phòng Kỹ thuật' } as any;
      const actorId = 5;
      const savedDepartment = { id: 1, ...dto, createdBy: actorId, updatedBy: actorId };

      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(savedDepartment as any);

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
      const dto = { name: 'Phòng Kỹ thuật (đổi tên)' } as any;
      const actorId = 7;
      const updatedDepartment = { id, ...dto, updatedBy: actorId };

      const updateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(updatedDepartment as any);

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
      const existingDepartment = { id, status: 'active' } as any;
      jest.spyOn(service, 'findOne').mockResolvedValue(existingDepartment);
      const updateSpy = jest.spyOn(service, 'update');

      const dto = { status: 'active' } as any;

      await expect(service.updateStatus(id, dto, actorId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateStatus(id, dto, actorId)).rejects.toThrow(
        'status-not-changed',
      );

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('nên cập nhật thành công khi status mới khác status hiện tại', async () => {
      const existingDepartment = { id, status: 'active' } as any;
      const updatedDepartment = { id, status: 'inactive', updatedBy: actorId };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingDepartment);
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(updatedDepartment as any);

      const dto = { status: 'inactive' } as any;

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
      const query = { page: 1, limit: 10 } as any;
      const expectedResult = {
        items: [{ id: 1, name: 'Phòng Kỹ thuật' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(expectedResult as any);

      const result = await service.list(query);

      expect(findAllSpy).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });
});