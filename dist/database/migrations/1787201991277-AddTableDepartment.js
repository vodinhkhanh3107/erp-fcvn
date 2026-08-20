"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTableDepartment1787201991277 = void 0;
class AddTableDepartment1787201991277 {
    constructor() {
        this.name = 'AddTableDepartment1787201991277';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`departments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(500) NULL, \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`date\` date NOT NULL, \`check_in\` time NOT NULL, \`check_out\` time NOT NULL, \`total_hours\` decimal(5,2) NOT NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`department_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'hr', 'manager', 'employee', 'accountant', 'bod', 'purchasing', 'warehouse', 'Event Manager') NOT NULL DEFAULT 'employee'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_0921d1972cf861d568f5271cd85\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_aa902e05aeb5fde7c1dd4ced2b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_aa902e05aeb5fde7c1dd4ced2b7\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_0921d1972cf861d568f5271cd85\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'hr', 'manager', 'employee', 'accountant', 'bod', 'purchasing') NOT NULL DEFAULT 'employee'`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`department_id\``);
        await queryRunner.query(`DROP TABLE \`attendances\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
    }
}
exports.AddTableDepartment1787201991277 = AddTableDepartment1787201991277;
//# sourceMappingURL=1787201991277-AddTableDepartment.js.map