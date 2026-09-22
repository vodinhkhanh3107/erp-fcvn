import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test1790045433741 implements MigrationInterface {
  name = 'Test1790045433741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\``);
    await queryRunner.query(
      `CREATE TABLE \`purchase_request_item_quotations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`supplier_id\` int NOT NULL, \`quoted_amount\` decimal(18,2) NOT NULL, \`purchase_request_item_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`ALTER TABLE \`suppliers\` DROP COLUMN \`supplier_quotation_id\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`position\` enum ('employee', 'manager', 'bod') NOT NULL DEFAULT 'employee'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` ADD \`signature_file_url\` varchar(500) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD \`signed_by\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD \`signed_at\` timestamp NULL`);
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` ADD \`po_issued_at\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` DROP FOREIGN KEY \`FK_548d16709a88eece700ce66620e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` CHANGE \`purchase_request_id\` \`purchase_request_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`request_key\` \`request_key\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`status\` \`status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`from_status\` \`from_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`to_status\` \`to_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` ADD CONSTRAINT \`FK_b13096790191b053c5dcb58999e\` FOREIGN KEY (\`purchase_request_item_id\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` ADD CONSTRAINT \`FK_32f18cd8cb6ca2ded3a74beb999\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` ADD CONSTRAINT \`FK_548d16709a88eece700ce66620e\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` DROP FOREIGN KEY \`FK_548d16709a88eece700ce66620e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` DROP FOREIGN KEY \`FK_32f18cd8cb6ca2ded3a74beb999\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` DROP FOREIGN KEY \`FK_b13096790191b053c5dcb58999e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`to_status\` \`to_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`from_status\` \`from_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`status\` \`status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`request_key\` \`request_key\` varchar(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` CHANGE \`purchase_request_id\` \`purchase_request_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` ADD CONSTRAINT \`FK_548d16709a88eece700ce66620e\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`po_issued_at\``);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signed_at\``);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signed_by\``);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signature_file_url\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`position\``);
    await queryRunner.query(`ALTER TABLE \`suppliers\` ADD \`supplier_quotation_id\` int NULL`);
    await queryRunner.query(`DROP TABLE \`purchase_request_item_quotations\``);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\` (\`purchase_request_id\`)`,
    );
  }
}
