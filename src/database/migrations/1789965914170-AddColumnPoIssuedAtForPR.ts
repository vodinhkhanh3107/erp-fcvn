import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnPoIssuedAtForPR1789965914170 implements MigrationInterface {
  name = 'AddColumnPoIssuedAtForPR1789965914170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` ADD \`po_issued_at\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`po_issued_at\``);
  }
}
