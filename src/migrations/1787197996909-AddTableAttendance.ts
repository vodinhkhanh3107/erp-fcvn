import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableAttendance1787197996909 implements MigrationInterface {
    name = 'AddTableAttendance1787197996909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`date\` date NOT NULL, \`check_in\` time NOT NULL, \`check_out\` time NOT NULL, \`total_hours\` decimal(5,2) NOT NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'hr', 'manager', 'employee', 'accountant', 'bod', 'purchasing', 'warehouse', 'Event Manager') NOT NULL DEFAULT 'employee'`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_aa902e05aeb5fde7c1dd4ced2b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_aa902e05aeb5fde7c1dd4ced2b7\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'hr', 'manager', 'employee', 'accountant', 'bod', 'purchasing') NOT NULL DEFAULT 'employee'`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
        await queryRunner.query(`DROP TABLE \`attendances\``);
    }

}
