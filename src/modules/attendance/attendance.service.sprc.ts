import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Attendance } from '../../models/attendence.entity';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockRepository: any;

  const fakeAttendance = {
    id: 1,
    userId: 1,
    date: '2026-08-20',
    checkIn: '08:00',
    checkOut: '17:30',
    totalHours: 9.5,
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create() — tự tính totalHours + chặn trùng ngày công', () => {
    it('checkOut <= checkIn → ném BadRequestException, KHÔNG được gọi save()', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { userId: 1, date: '2026-08-20', checkIn: '17:00', checkOut: '08:00' } as any,
          99,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('đã có bản ghi chấm công cho đúng userId + date → ném ConflictException', async () => {
      mockRepository.findOne.mockResolvedValue(fakeAttendance);

      await expect(
        service.create(
          { userId: 1, date: '2026-08-20', checkIn: '08:00', checkOut: '17:30' } as any,
          99,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('hợp lệ → tính đúng totalHours, lưu kèm createdBy/updatedBy', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data: any) => data);
      mockRepository.save.mockImplementation((entity: any) =>
        Promise.resolve({ id: 1, ...entity }),
      );

      const result = await service.create(
        { userId: 1, date: '2026-08-20', checkIn: '08:00', checkOut: '17:30' } as any,
        99,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalHours: 9.5, createdBy: 99, updatedBy: 99 }),
      );
      expect(result.result.totalHours).toBe(9.5);
      expect(result.message).toBe('Ghi nhận chấm công thành công');
    });

    it('tính đúng số giờ lẻ, làm tròn 2 chữ số thập phân', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data: any) => data);
      mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.create(
        { userId: 1, date: '2026-08-20', checkIn: '08:15', checkOut: '17:40' } as any,
        99,
      );

      expect(result.result.totalHours).toBe(9.42);
    });
  });

  describe('findAll()', () => {
    it('có fromDate + toDate → xây where.date bằng Between()', async () => {
      mockRepository.findAndCount.mockResolvedValue([[fakeAttendance], 1]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        fromDate: '2026-08-01',
        toDate: '2026-08-31',
      } as any);

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.date).toBeDefined();
      expect(result.items).toEqual([fakeAttendance]);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('có userId → lọc đúng theo userId', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, userId: 5 } as any);

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.userId).toBe(5);
      expect(callArgs.relations).toEqual({ user: true });
    });
  });

  describe('findOne()', () => {
    it('không tìm thấy → ném NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('tìm thấy → trả về đúng bản ghi', async () => {
      mockRepository.findOne.mockResolvedValue(fakeAttendance);
      const result = await service.findOne(1);
      expect(result).toEqual(fakeAttendance);
    });
  });
});
