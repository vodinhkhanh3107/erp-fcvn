import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateGoodReceiptItemDto {
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @IsInt()
  @Min(1)
  quantityOrdered: number; // QTY_PO — copy từ PO item, client tự truyền lúc tạo (đối chiếu lại BR-01 ở service)

  @IsInt()
  @Min(0)
  quantityReceived: number; // BR-01: phải <= quantityOrdered
}
