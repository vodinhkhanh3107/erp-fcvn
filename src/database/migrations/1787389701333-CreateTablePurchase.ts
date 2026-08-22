import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablePurchase1787389701333 implements MigrationInterface {
    name = 'CreateTablePurchase1787389701333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`purchase_order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_order_id\` int NOT NULL, \`item_name\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`supplier_id\` int NOT NULL, \`total_amount\` decimal(18,2) NOT NULL, \`payment_term\` varchar(50) NULL, \`status\` enum ('Draft', 'Released') NOT NULL DEFAULT 'Draft', \`created_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_13978d65359b4969947011159f\` (\`purchase_request_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_request_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`item_name\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_request_quotations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchase_request_id\` int NOT NULL, \`supplier_id\` int NOT NULL, \`quoted_amount\` decimal(18,2) NOT NULL, \`quotation_file_url\` varchar(500) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_requests\` (\`id\` int NOT NULL AUTO_INCREMENT, \`department_id\` int NULL, \`requester_id\` int NOT NULL, \`request_key\` varchar(100) NULL, \`purpose_of_use\` varchar(500) NOT NULL, \`status\` enum ('Draft', 'Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending', \`approved_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a98681cc83a5245014e710ffc5\` (\`request_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` ADD CONSTRAINT \`FK_3f92bb44026cedfe235c8b91244\` FOREIGN KEY (\`purchase_order_id\`) REFERENCES \`purchase_orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` ADD CONSTRAINT \`FK_d16a885aa88447ccfd010e739b0\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_items\` ADD CONSTRAINT \`FK_548d16709a88eece700ce66620e\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_c1df96a55c4e500d8a202c36f8c\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` ADD CONSTRAINT \`FK_96bab38a07606eccfdf95032586\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD CONSTRAINT \`FK_3ee8e94c75dcdbe9029954d0f87\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` ADD CONSTRAINT \`FK_f4a79f7b7ce5945c1c2f7e07174\` FOREIGN KEY (\`requester_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP FOREIGN KEY \`FK_f4a79f7b7ce5945c1c2f7e07174\``);
        await queryRunner.query(`ALTER TABLE \`purchase_requests\` DROP FOREIGN KEY \`FK_3ee8e94c75dcdbe9029954d0f87\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_96bab38a07606eccfdf95032586\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_quotations\` DROP FOREIGN KEY \`FK_c1df96a55c4e500d8a202c36f8c\``);
        await queryRunner.query(`ALTER TABLE \`purchase_request_items\` DROP FOREIGN KEY \`FK_548d16709a88eece700ce66620e\``);
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` DROP FOREIGN KEY \`FK_d16a885aa88447ccfd010e739b0\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` DROP FOREIGN KEY \`FK_3f92bb44026cedfe235c8b91244\``);
        await queryRunner.query(`DROP INDEX \`IDX_a98681cc83a5245014e710ffc5\` ON \`purchase_requests\``);
        await queryRunner.query(`DROP TABLE \`purchase_requests\``);
        await queryRunner.query(`DROP TABLE \`purchase_request_quotations\``);
        await queryRunner.query(`DROP TABLE \`purchase_request_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_13978d65359b4969947011159f\` ON \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_order_items\``);
    }

}
