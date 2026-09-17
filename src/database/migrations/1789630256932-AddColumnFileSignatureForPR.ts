import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnFileSignatureForPR1789630256932 implements MigrationInterface {
  name = 'AddColumnFileSignatureForPR1789630256932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` ADD \`signature_file_url\` varchar(500) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD \`signed_by\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD \`signed_at\` timestamp NULL`);
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`status\` \`status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`from_status\` \`from_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`to_status\` \`to_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SIGNED') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`to_status\` \`to_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_request_histories\` CHANGE \`from_status\` \`from_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_requests\` CHANGE \`status\` \`status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signed_at\``);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signed_by\``);
    await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP COLUMN \`signature_file_url\``);
  }
}
