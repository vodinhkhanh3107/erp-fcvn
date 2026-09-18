import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation31789553248735 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation31789553248735';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` DROP FOREIGN KEY \`FK_548d16709a88eece700ce66620e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` CHANGE \`purchase_request_id\` \`purchase_request_id\` int NULL`,
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
      `ALTER TABLE \`purchase_request_items\` CHANGE \`purchase_request_id\` \`purchase_request_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_items\` ADD CONSTRAINT \`FK_548d16709a88eece700ce66620e\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
