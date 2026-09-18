import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnSupplierIdForSupllierQuotation21789378465078 implements MigrationInterface {
  name = 'AddColumnSupplierIdForSupllierQuotation21789378465078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`FK_aa79374390daad9a70228f99cc6\` ON \`supplier_quotations\``,
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
      `CREATE INDEX \`FK_aa79374390daad9a70228f99cc6\` ON \`supplier_quotations\` (\`supplier_id\`)`,
    );
  }
}
