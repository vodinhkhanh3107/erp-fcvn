import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableUser1787221889017 implements MigrationInterface {
    name = 'AddTableUser1787221889017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`full_name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(15) NULL, \`password\` varchar(255) NOT NULL, \`refresh_token_hash\` varchar(255) NULL, \`role\` enum ('admin', 'hr', 'manager', 'employee', 'accountant', 'bod', 'purchasing', 'warehouse', 'Event Manager') NOT NULL DEFAULT 'employee', \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`avatar\` varchar(255) NOT NULL DEFAULT '', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_a000cca60bcf04454e72769949\` (\`phone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`kpis\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`period\` varchar(20) NOT NULL, \`target_value\` decimal(18,2) NOT NULL, \`actual_value\` decimal(18,2) NOT NULL, \`kpi_status\` enum ('On-track', 'Off-track') NOT NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tasks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`task_name\` varchar(255) NOT NULL, \`task_type\` varchar(100) NOT NULL, \`priority\` enum ('High', 'Medium', 'Low') NOT NULL, \`deadline\` date NOT NULL, \`assigned_to\` int NOT NULL, \`status\` enum ('New', 'In Progress', 'Done') NOT NULL DEFAULT 'New', \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`suppliers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`tax_code\` varchar(50) NOT NULL, \`contact_name\` varchar(100) NULL, \`contact_email\` varchar(100) NULL, \`contact_phone\` varchar(20) NULL, \`payment_term\` varchar(20) NULL, \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`group_id\` int NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_8278dbe9decb563689d76be5d2\` (\`tax_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`supplier_groups\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(50) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(500) NULL, \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`text\` varchar(100) NOT NULL, UNIQUE INDEX \`IDX_ddd28b2e81762818846a99ea40\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD CONSTRAINT \`FK_75cd42b51d618b98db59e084330\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_5770b28d72ca90c43b1381bf787\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_aa902e05aeb5fde7c1dd4ced2b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`suppliers\` ADD CONSTRAINT \`FK_0867a763d6f99afc1f5e18e55f8\` FOREIGN KEY (\`group_id\`) REFERENCES \`supplier_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`suppliers\` DROP FOREIGN KEY \`FK_0867a763d6f99afc1f5e18e55f8\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_aa902e05aeb5fde7c1dd4ced2b7\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_5770b28d72ca90c43b1381bf787\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP FOREIGN KEY \`FK_75cd42b51d618b98db59e084330\``);
        await queryRunner.query(`DROP INDEX \`IDX_ddd28b2e81762818846a99ea40\` ON \`supplier_groups\``);
        await queryRunner.query(`DROP TABLE \`supplier_groups\``);
        await queryRunner.query(`DROP INDEX \`IDX_8278dbe9decb563689d76be5d2\` ON \`suppliers\``);
        await queryRunner.query(`DROP TABLE \`suppliers\``);
        await queryRunner.query(`DROP TABLE \`tasks\``);
        await queryRunner.query(`DROP TABLE \`kpis\``);
        await queryRunner.query(`DROP INDEX \`IDX_a000cca60bcf04454e72769949\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
