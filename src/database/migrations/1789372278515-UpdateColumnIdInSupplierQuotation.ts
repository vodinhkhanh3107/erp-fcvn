import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnIdInSupplierQuotation1789372278515 implements MigrationInterface {
  name = 'UpdateColumnIdInSupplierQuotation1789372278515';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` CHANGE \`quotation_id\` \`id\` int NOT NULL AUTO_INCREMENT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` CHANGE \`id\` \`quotation_id\` int NOT NULL AUTO_INCREMENT`,
    );
  }
}
