import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation1789546103976 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation1789546103976';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` DROP COLUMN \`purchase_request_id\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_quotations\` ADD \`purchase_request_id\` int NOT NULL`,
    );
  }
}
