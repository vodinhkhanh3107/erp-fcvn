import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from 'src/common/logger/app-logger.service';
import { GoodReceipt, GoodReceiptStatus } from 'src/models/good-receipt.entity';
import { PurchaseOrder } from 'src/models/purchase-order.entity';
import { Stock } from 'src/models/stock.entity';
import { EntityManager, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateGoodReceiptDto } from './dto/create-good-receipt.dto';
import { ListGoodReceiptDto } from './dto/list-good-receipt.dto';

@Injectable()
export class GoodReceiptService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(GoodReceipt)
    private readonly goodReceiptRepository: Repository<GoodReceipt>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('GoodReceiptService');
  }

  private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Transaction failed, rolled back');
    } finally {
      await queryRunner.release();
    }
  }

  async create(dto: CreateGoodReceiptDto, actorId: number) {
    const po = await this.poRepository.findOneBy({ id: dto.poId });
    if (!po) throw new NotFoundException('not-found-purchas-order');
    console.log(po);

    // if(po.stat)
    return {};

    // const po = await this.poRepository.findOne({ where: { id: dto.poId } });
    // if (!po) throw new NotFoundException('purchase-order-not-found');
    // if (po.status !== PurchaseOrderStatus.RELEASED) {
    //   throw new BadRequestException('purchase-order-must-be-released-before-creating-goodReceipt');
    // }

    // for (const item of dto.items) {
    //   if (item.quantityReceived > item.quantityOrdered) {
    //     throw new BadRequestException(
    //       `quantity-received-exceeds-quantity-ordered: "${item.itemName}" (${item.quantityReceived} > ${item.quantityOrdered})`,
    //     );
    //   }
    // }

    // const goodReceipt = this.goodReceiptRepository.create({
    //   poId: dto.poId,
    //   receivedBy: actorId,
    //   status: GoodReceiptStatus.PENDING,
    //   items: dto.items.map((i) => ({
    //     itemName: i.itemName,
    //     quantityOrdered: i.quantityOrdered,
    //     quantityReceived: i.quantityReceived,
    //   })),
    // });
    // const saved = await this.goodReceiptRepository.save(goodReceipt);

    // this.logger.log(`Đã tạo phiếu nhập kho #${saved.id} cho PO #${dto.poId} (Pending)`);
    // return { message: 'Tạo phiếu nhập kho thành công, chờ xác nhận', result: saved };
  }

  async confirm(id: number, actorId: number) {
    const goodReceipt = await this.findOne(id);

    if (goodReceipt.status !== GoodReceiptStatus.PENDING) {
      throw new BadRequestException('goodReceipt-not-pending');
    }

    const result = await this.runInTransaction(async (manager) => {
      goodReceipt.status = GoodReceiptStatus.COMPLETED;
      goodReceipt.receivedAt = new Date();
      const updatedGoodReceipt = await manager.save(goodReceipt);

      // Cập nhật tồn kho — cộng dồn theo itemName, tạo mới Stock nếu chưa từng có
      for (const item of goodReceipt.items!) {
        let stock = await manager.findOne(Stock, { where: { itemName: item.itemName } });
        if (!stock) {
          stock = manager.create(Stock, { itemName: item.itemName, quantityOnHand: 0 });
        }
        stock.quantityOnHand += item.quantityReceived;
        await manager.save(stock);
      }

      return updatedGoodReceipt;
    });

    this.logger.log(
      `Đã xác nhận nhập kho GoodReceipt #${id} bởi #${actorId} — tồn kho đã cập nhật`,
    );
    return { message: 'Xác nhận nhập kho thành công, tồn kho đã cập nhật', result };
  }

  async findAll(query: ListGoodReceiptDto) {
    const { page, limit, poId, status } = query;
    const where: Record<string, any> = {};
    if (poId) where.poId = poId;
    if (status) where.status = status;

    const [items, total] = await this.goodReceiptRepository.findAndCount({
      where,
      relations: { purchaseOrder: true, receiver: true, items: true },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const goodReceipt = await this.goodReceiptRepository.findOne({
      where: { id },
      relations: { purchaseOrder: true, receiver: true, items: true },
    });
    if (!goodReceipt) throw new NotFoundException('goodReceipt-not-found');
    return goodReceipt;
  }
}
