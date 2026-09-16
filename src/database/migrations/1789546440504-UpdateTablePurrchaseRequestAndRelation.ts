import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation1789546440504 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation1789546440504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_49ac9d5702ffa976fe608f67c39\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`purchase_request_item_id\` \`itemId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_c77698a9ef7b65d11823ebf79ef\` FOREIGN KEY (\`itemId\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_c77698a9ef7b65d11823ebf79ef\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`itemId\` \`purchase_request_item_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_49ac9d5702ffa976fe608f67c39\` FOREIGN KEY (\`purchase_request_item_id\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
