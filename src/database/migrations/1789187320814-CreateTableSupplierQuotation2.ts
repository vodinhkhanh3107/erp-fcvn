import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableSupplierQuotation21789187320814 implements MigrationInterface {
  name = 'CreateTableSupplierQuotation21789187320814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`supplier_quotations\` (\`quotation_id\` int NOT NULL AUTO_INCREMENT, \`file_url\` varchar(500) NOT NULL, \`file_name\` varchar(255) NOT NULL, \`file_size\` int NOT NULL, \`storage_key\` varchar(500) NOT NULL, \`uploaded_by\` int NOT NULL, \`uploaded_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`supplierId\` int NULL, PRIMARY KEY (\`quotation_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`ALTER TABLE \`suppliers\` ADD \`supplier_quotation_id\` int NULL`);
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` ADD UNIQUE INDEX \`IDX_973ef1681425ad1146fbbeafe1\` (\`contact_name\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` ADD UNIQUE INDEX \`IDX_c1f0d9a2830e0e24258e10da58\` (\`contact_email\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` ADD UNIQUE INDEX \`IDX_d5d9c5b0c2d61a0ca6f3b1bdb6\` (\`contact_phone\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` ADD CONSTRAINT \`FK_a4cbe82393e3d52ed02dde397ae\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_quotations\` DROP FOREIGN KEY \`FK_a4cbe82393e3d52ed02dde397ae\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` DROP INDEX \`IDX_d5d9c5b0c2d61a0ca6f3b1bdb6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` DROP INDEX \`IDX_c1f0d9a2830e0e24258e10da58\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`suppliers\` DROP INDEX \`IDX_973ef1681425ad1146fbbeafe1\``,
    );
    await queryRunner.query(`ALTER TABLE \`suppliers\` DROP COLUMN \`supplier_quotation_id\``);
    await queryRunner.query(`DROP TABLE \`supplier_quotations\``);
  }
}
