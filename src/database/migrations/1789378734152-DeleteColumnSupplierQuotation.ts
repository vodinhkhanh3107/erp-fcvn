import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteColumnSupplierQuotation1789378734152 implements MigrationInterface {
  name = 'DeleteColumnSupplierQuotation1789378734152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`suppliers\` DROP COLUMN \`supplier_quotation_id\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`suppliers\` ADD \`supplier_quotation_id\` int NULL`);
  }
}
