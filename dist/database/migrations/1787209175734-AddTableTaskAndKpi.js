"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTableTaskAndKpi1787209175734 = void 0;
class AddTableTaskAndKpi1787209175734 {
    constructor() {
        this.name = 'AddTableTaskAndKpi1787209175734';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`tasks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`task_name\` varchar(255) NOT NULL, \`task_type\` varchar(100) NOT NULL, \`priority\` enum ('High', 'Medium', 'Low') NOT NULL, \`deadline\` date NOT NULL, \`assigned_to\` int NOT NULL, \`status\` enum ('New', 'In Progress', 'Done') NOT NULL DEFAULT 'New', \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`kpis\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`period\` varchar(20) NOT NULL, \`target_value\` decimal(18,2) NOT NULL, \`actual_value\` decimal(18,2) NOT NULL, \`kpi_status\` enum ('On-track', 'Off-track') NOT NULL, \`created_by\` int NULL, \`updated_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_5770b28d72ca90c43b1381bf787\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD CONSTRAINT \`FK_75cd42b51d618b98db59e084330\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP FOREIGN KEY \`FK_75cd42b51d618b98db59e084330\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_5770b28d72ca90c43b1381bf787\``);
        await queryRunner.query(`DROP TABLE \`kpis\``);
        await queryRunner.query(`DROP TABLE \`tasks\``);
    }
}
exports.AddTableTaskAndKpi1787209175734 = AddTableTaskAndKpi1787209175734;
//# sourceMappingURL=1787209175734-AddTableTaskAndKpi.js.map