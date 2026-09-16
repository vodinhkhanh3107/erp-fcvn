import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTablePurrchaseRequestAndRelation1789541638368 implements MigrationInterface {
  name = 'UpdateTablePurrchaseRequestAndRelation1789541638368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`FK_c1df96a55c4e500d8a202c36f8c\` ON \`purchase_request_quotations\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`FK_c1df96a55c4e500d8a202c36f8c\` ON \`purchase_request_quotations\` (\`purchase_request_id\`)`,
    );
  }
}
