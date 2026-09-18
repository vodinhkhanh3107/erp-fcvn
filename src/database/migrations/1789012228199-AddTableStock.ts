import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableStock1789012228199 implements MigrationInterface {
  name = 'AddTableStock1789012228199';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`stocks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`item_name\` varchar(255) NOT NULL, \`quantity_on_hand\` int NOT NULL DEFAULT '0', \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7c835ea034a03eefc95f7eb680\` (\`item_name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`good_receipt_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`grn_id\` int NOT NULL, \`item_name\` varchar(255) NOT NULL, \`quantity_ordered\` int NOT NULL, \`quantity_received\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`good_receipts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`po_id\` int NOT NULL, \`received_at\` datetime NULL, \`received_by\` int NOT NULL, \`status\` enum ('Pending', 'Completed') NOT NULL DEFAULT 'Pending', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`good_receipt_items\` ADD CONSTRAINT \`FK_f888b7ccccf38b6e3c769fb1994\` FOREIGN KEY (\`grn_id\`) REFERENCES \`good_receipts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`good_receipts\` ADD CONSTRAINT \`FK_dad28af2c5b117efe8a76767c7d\` FOREIGN KEY (\`po_id\`) REFERENCES \`purchase_orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`good_receipts\` ADD CONSTRAINT \`FK_a8ed86cec7b9d7c214e97104b80\` FOREIGN KEY (\`received_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`good_receipts\` DROP FOREIGN KEY \`FK_a8ed86cec7b9d7c214e97104b80\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`good_receipts\` DROP FOREIGN KEY \`FK_dad28af2c5b117efe8a76767c7d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`good_receipt_items\` DROP FOREIGN KEY \`FK_f888b7ccccf38b6e3c769fb1994\``,
    );
    await queryRunner.query(`DROP TABLE \`good_receipts\``);
    await queryRunner.query(`DROP TABLE \`good_receipt_items\``);
    await queryRunner.query(`DROP INDEX \`IDX_7c835ea034a03eefc95f7eb680\` ON \`stocks\``);
    await queryRunner.query(`DROP TABLE \`stocks\``);
  }
}
