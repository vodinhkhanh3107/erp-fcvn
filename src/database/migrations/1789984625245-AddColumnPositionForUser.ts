import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnPositionForUser1789984625245 implements MigrationInterface {
  name = 'AddColumnPositionForUser1789984625245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`position\` enum ('employee', 'manager', 'bod') NOT NULL DEFAULT 'employee'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`position\``);
  }
}
