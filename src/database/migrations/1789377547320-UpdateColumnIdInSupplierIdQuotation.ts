import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnIdInSupplierIdQuotation1789377547320 implements MigrationInterface {
  name = 'UpdateColumnIdInSupplierIdQuotation1789377547320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` DROP FOREIGN KEY \`FK_a4cbe82393e3d52ed02dde397ae\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` CHANGE \`supplierId\` \`supplier_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` ADD CONSTRAINT \`FK_aa79374390daad9a70228f99cc6\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` DROP FOREIGN KEY \`FK_aa79374390daad9a70228f99cc6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` CHANGE \`supplier_id\` \`supplierId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` ADD CONSTRAINT \`FK_a4cbe82393e3d52ed02dde397ae\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
