import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation1789533814675 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation1789533814675';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_c1df96a55c4e500d8a202c36f8c\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\``);
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`quotation_file_url\` \`purchase_request_item_id\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP COLUMN \`purchase_request_item_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD \`purchase_request_item_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_49ac9d5702ffa976fe608f67c39\` FOREIGN KEY (\`purchase_request_item_id\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_49ac9d5702ffa976fe608f67c39\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP COLUMN \`purchase_request_item_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD \`purchase_request_item_id\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`purchase_request_item_id\` \`quotation_file_url\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\` (\`purchase_request_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_c1df96a55c4e500d8a202c36f8c\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
