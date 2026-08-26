import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTableUser1787651701941 implements MigrationInterface {
    name = 'InitialTableUser1787651701941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`purchase_order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_order_id\` int NOT NULL, \`item_name\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`supplier_id\` int NOT NULL, \`total_amount\` decimal(18,2) NOT NULL, \`payment_term\` varchar(50) NULL, \`status\` enum ('Draft', 'Released') NOT NULL DEFAULT 'Draft', \`created_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_13978d65359b4969947011159f\` (\`purchase_request_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`departments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(500) NULL, \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`manager_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_request_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`item_name\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_request_quotations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`supplier_id\` int NOT NULL, \`quoted_amount\` decimal(18,2) NOT NULL, \`quotation_file_url\` varchar(500) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_requests\` (\`id\` int NOT NULL AUTO_INCREMENT, \`request_key\` varchar(100) NULL, \`department_id\` int NULL, \`requester_id\` int NOT NULL, \`purpose_of_use\` varchar(500) NOT NULL, \`status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT', \`approved_by\` int NULL, \`reject_reason\` varchar(500) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a98681cc83a5245014e710ffc5\` (\`request_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_request_histories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`from_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NULL, \`to_status\` enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL, \`actor_id\` int NOT NULL, \`note\` varchar(500) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`actor_id\` int NOT NULL, \`actor_role\` varchar(50) NOT NULL, \`action\` enum ('CREATE', 'UPDATE', 'DELETE') NOT NULL, \`entity_type\` varchar(100) NOT NULL, \`entity_id\` int NULL, \`method\` varchar(10) NOT NULL, \`path\` varchar(500) NOT NULL, \`request_body\` text NULL, \`status_code\` int NOT NULL, \`success\` tinyint NOT NULL, \`error_message\` varchar(500) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_177183f29f438c488b5e8510cd\` (\`actor_id\`), INDEX \`IDX_ea9ba3dfb39050f831ee3be40d\` (\`entity_type\`), INDEX \`IDX_85c204d8e47769ac183b32bf9c\` (\`entity_id\`), INDEX \`IDX_2cd10fda8276bb995288acfbfb\` (\`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`date\` date NOT NULL, \`check_in\` time NOT NULL, \`check_out\` time NOT NULL, \`total_hours\` decimal(5,2) NOT NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`contract_type\` enum ('trial', 'official', 'part_time') NOT NULL DEFAULT 'trial'`);
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` date NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`suppliers\` ADD CONSTRAINT \`FK_0867a763d6f99afc1f5e18e55f8\` FOREIGN KEY (\`group_id\`) REFERENCES \`supplier_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` ADD CONSTRAINT \`FK_3f92bb44026cedfe235c8b91244\` FOREIGN KEY (\`purchase_order_id\`) REFERENCES \`purchase_orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` ADD CONSTRAINT \`FK_d16a885aa88447ccfd010e739b0\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_ef8a4fb89ff96bbe98f1798798c\` FOREIGN KEY (\`manager_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_items\` ADD CONSTRAINT \`FK_548d16709a88eece700ce66620e\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_c1df96a55c4e500d8a202c36f8c\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_96bab38a07606eccfdf95032586\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD CONSTRAINT \`FK_3ee8e94c75dcdbe9029954d0f87\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD CONSTRAINT \`FK_f4a79f7b7ce5945c1c2f7e07174\` FOREIGN KEY (\`requester_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_histories\` ADD CONSTRAINT \`FK_a30473225111d5467bd637f7725\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_histories\` ADD CONSTRAINT \`FK_d7857ff0fe08ead040bdf74ec69\` FOREIGN KEY (\`actor_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_aa902e05aeb5fde7c1dd4ced2b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_aa902e05aeb5fde7c1dd4ced2b7\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_histories\` DROP FOREIGN KEY \`FK_d7857ff0fe08ead040bdf74ec69\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_histories\` DROP FOREIGN KEY \`FK_a30473225111d5467bd637f7725\``);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP FOREIGN KEY \`FK_f4a79f7b7ce5945c1c2f7e07174\``);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP FOREIGN KEY \`FK_3ee8e94c75dcdbe9029954d0f87\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_96bab38a07606eccfdf95032586\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_c1df96a55c4e500d8a202c36f8c\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_items\` DROP FOREIGN KEY \`FK_548d16709a88eece700ce66620e\``);
        await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_ef8a4fb89ff96bbe98f1798798c\``);
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` DROP FOREIGN KEY \`FK_d16a885aa88447ccfd010e739b0\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` DROP FOREIGN KEY \`FK_3f92bb44026cedfe235c8b91244\``);
        await queryRunner.query(`ALTER TABLE \`suppliers\` DROP FOREIGN KEY \`FK_0867a763d6f99afc1f5e18e55f8\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`contract_type\``);
        await queryRunner.query(`DROP TABLE \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_2cd10fda8276bb995288acfbfb\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_85c204d8e47769ac183b32bf9c\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_ea9ba3dfb39050f831ee3be40d\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_177183f29f438c488b5e8510cd\` ON \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`purchase_request_histories\``);
        await queryRunner.query(`DROP INDEX \`IDX_a98681cc83a5245014e710ffc5\` ON \`purchase_requests\``);
        await queryRunner.query(`DROP TABLE \`purchase_requests\``);
        await queryRunner.query(`DROP TABLE \`purchase_request_quotations\``);
        await queryRunner.query(`DROP TABLE \`purchase_request_items\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
        await queryRunner.query(`DROP INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_order_items\``);
    }

}
