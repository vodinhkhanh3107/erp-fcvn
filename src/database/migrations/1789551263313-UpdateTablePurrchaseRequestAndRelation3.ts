import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation31789551263313 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation31789551263313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_c77698a9ef7b65d11823ebf79ef\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`itemId\` \`item_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_84c2ae4a060dabd0c5e62698177\` FOREIGN KEY (\`item_id\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_84c2ae4a060dabd0c5e62698177\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` CHANGE \`item_id\` \`itemId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_c77698a9ef7b65d11823ebf79ef\` FOREIGN KEY (\`itemId\`) REFERENCES \`purchase_request_items\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
