import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { LeaveService } from './leave.service';
import { Leave, LeaveStatus } from '../../models/leave.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
});

describe('LeaveService', () => {
  let service: LeaveService;
  let repository: MockRepository<Leave>;

  const FIXED_TODAY = new Date('2026-08-27T08:00:00.000Z'); 

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(FIXED_TODAY);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: getRepositoryToken(Leave),
          useValue: createMockRepository<Leave>(),
        },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    repository = module.get(getRepositoryToken(Leave));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('nên được định nghĩa', () => {
    expect(service).toBeDefined();
  });

  describe('createLeaveRequest', () => {
    const userId = 1;

    it('nên throw BadRequestException nếu endDate trước startDate', async () => {
      const dto = { startDate: '2026-09-05', endDate: '2026-09-01' } as any;

      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(
        'end-date-must-be-after-start-date',
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('nên throw BadRequestException nếu startDate là hôm nay (chưa đủ báo trước 1 ngày)', async () => {
      const dto = { startDate: '2026-08-27', endDate: '2026-08-28' } as any; // = FIXED_TODAY

      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(
        'leave-must-be-requested-at-least-1-day-in-advance',
      );
    });

    it('nên throw BadRequestException nếu startDate ở quá khứ', async () => {
      const dto = { startDate: '2026-08-01', endDate: '2026-08-05' } as any;

      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(
        'leave-must-be-requested-at-least-1-day-in-advance',
      );
    });

    it('nên cho phép startDate đúng bằng tomorrow (biên hợp lệ)', async () => {
      const dto = { startDate: '2026-08-28', endDate: '2026-08-30' } as any;

      (repository.findOne as jest.Mock).mockResolvedValue(null); 
      const createdEntity = { ...dto, userId, status: LeaveStatus.PENDING };
      const savedEntity = { id: 1, ...createdEntity };
      (repository.create as jest.Mock).mockReturnValue(createdEntity);
      (repository.save as jest.Mock).mockResolvedValue(savedEntity);

      const result = await service.createLeaveRequest(userId, dto);

      expect(result).toEqual({
        message: 'Gửi yêu cầu nghỉ phép thành công',
        result: savedEntity,
      });
    });

    it('nên throw BadRequestException nếu trùng với lịch nghỉ đã APPROVED trước đó', async () => {
      const dto = { startDate: '2026-09-01', endDate: '2026-09-05' } as any;

      const overlappingLeave = { id: 99, userId, status: LeaveStatus.APPROVED };
      (repository.findOne as jest.Mock).mockResolvedValue(overlappingLeave);

      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createLeaveRequest(userId, dto)).rejects.toThrow(
        'overlapping-with-an-already-approved-leave',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          status: LeaveStatus.APPROVED,
          startDate: LessThanOrEqual(dto.endDate),
          endDate: MoreThanOrEqual(dto.startDate),
        },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('nên tạo yêu cầu nghỉ phép thành công với status mặc định PENDING khi không trùng lịch', async () => {
      const dto = { startDate: '2026-09-10', endDate: '2026-09-12' } as any;

      (repository.findOne as jest.Mock).mockResolvedValue(null);
      const createdEntity = { ...dto, userId, status: LeaveStatus.PENDING };
      const savedEntity = { id: 5, ...createdEntity };
      (repository.create as jest.Mock).mockReturnValue(createdEntity);
      (repository.save as jest.Mock).mockResolvedValue(savedEntity);

      const result = await service.createLeaveRequest(userId, dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        userId,
        status: LeaveStatus.PENDING,
      });
      expect(result).toEqual({
        message: 'Gửi yêu cầu nghỉ phép thành công',
        result: savedEntity,
      });
    });

    it('KHÔNG nên chặn nếu lịch trùng ngày nhưng lịch cũ chưa được APPROVED (vd. PENDING)', async () => {
      const dto = { startDate: '2026-09-01', endDate: '2026-09-05' } as any;

      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation((data) => data);
      (repository.save as jest.Mock).mockImplementation(async (entity) => ({ id: 10, ...entity }));

      const result = await service.createLeaveRequest(userId, dto);

      expect(result.result).toEqual(
        expect.objectContaining({ status: LeaveStatus.PENDING }),
      );
    });
  });

  describe('findAll', () => {
    it('nên trả về danh sách kèm phân trang, không filter khi query rỗng', async () => {
      const query = { page: 1, limit: 10 } as any;
      const items = [{ id: 1, startDate: '2026-09-01' }];

      (repository.findAndCount as jest.Mock).mockResolvedValue([items, 1]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { user: true },
        order: { startDate: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('nên áp dụng filter userId và status khi được truyền vào query', async () => {
      const query = { page: 1, limit: 10, userId: 3, status: LeaveStatus.PENDING } as any;

      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 3, status: LeaveStatus.PENDING },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('nên throw NotFoundException khi không tìm thấy leave', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('leave-not-found');
    });

    it('nên trả về leave kèm relation user khi tìm thấy', async () => {
      const leave = { id: 1, userId: 5, user: { id: 5, fullName: 'Nhân viên A' } };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { user: true },
      });
      expect(result).toEqual(leave);
    });
  });

  describe('findOneForSelf', () => {
    it('nên throw ForbiddenException nếu userId không khớp chủ sở hữu leave', async () => {
      const leave = { id: 1, userId: 5 };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);

      await expect(service.findOneForSelf(1, 999)).rejects.toThrow(ForbiddenException);
      await expect(service.findOneForSelf(1, 999)).rejects.toThrow('access-denied');
    });

    it('nên trả về leave khi userId khớp đúng chủ sở hữu', async () => {
      const leave = { id: 1, userId: 5 };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);

      const result = await service.findOneForSelf(1, 5);

      expect(result).toEqual(leave);
    });

    it('nên throw NotFoundException nếu leave không tồn tại (kế thừa qua findOne)', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneForSelf(999, 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('review', () => {
    const approverId = 10;

    it('nên throw BadRequestException nếu leave đã được duyệt trước đó (không còn PENDING)', async () => {
      const leave = { id: 1, status: LeaveStatus.APPROVED, userId: 5 };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);

      await expect(
        service.review(1, { status: LeaveStatus.APPROVED } as any, approverId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.review(1, { status: LeaveStatus.APPROVED } as any, approverId),
      ).rejects.toThrow('leave-already-reviewed');

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('nên throw NotFoundException nếu leave không tồn tại', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.review(999, { status: LeaveStatus.APPROVED } as any, approverId),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên cập nhật status và approvedBy khi leave đang PENDING', async () => {
      const leave = { id: 1, status: LeaveStatus.PENDING, userId: 5, approvedBy: null };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);
      (repository.save as jest.Mock).mockImplementation(async (entity) => entity);

      const dto = { status: LeaveStatus.APPROVED } as any;
      const result = await service.review(1, dto, approverId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LeaveStatus.APPROVED,
          approvedBy: approverId,
        }),
      );
      expect(result).toEqual({
        message: 'Duyệt yêu cầu nghỉ phép thành công',
        result: expect.objectContaining({
          status: LeaveStatus.APPROVED,
          approvedBy: approverId,
        }),
      });
    });

    it('nên cho phép từ chối (status = REJECTED) khi leave đang PENDING', async () => {
      const leave = { id: 1, status: LeaveStatus.PENDING, userId: 5 };
      (repository.findOne as jest.Mock).mockResolvedValue(leave);
      (repository.save as jest.Mock).mockImplementation(async (entity) => entity);

      const dto = { status: LeaveStatus.REJECTED } as any;
      const result = await service.review(1, dto, approverId);

      expect(result.result.status).toBe(LeaveStatus.REJECTED);
    });
  });
});