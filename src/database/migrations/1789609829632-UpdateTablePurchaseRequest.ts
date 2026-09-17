import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurchaseRequest1789609829632 implements MigrationInterface {
  name = 'UpdateTablePurchaseRequest1789609829632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`purchase_request_item_quotations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`supplier_id\` int NOT NULL, \`quoted_amount\` decimal(18,2) NOT NULL, \`purchase_request_item_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`request_key\` \`request_key\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` ADD CONSTRAINT \`FK_b13096790191b053c5dcb58999e\` FOREIGN KEY (\`purchase_request_item_id\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` ADD CONSTRAINT \`FK_32f18cd8cb6ca2ded3a74beb999\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` DROP FOREIGN KEY \`FK_32f18cd8cb6ca2ded3a74beb999\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_item_quotations\` DROP FOREIGN KEY \`FK_b13096790191b053c5dcb58999e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`request_key\` \`request_key\` varchar(100) NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE \`purchase_request_item_quotations\``);
  }
}
