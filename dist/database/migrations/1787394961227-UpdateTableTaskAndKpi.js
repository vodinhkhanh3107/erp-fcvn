"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTableTaskAndKpi1787394961227 = void 0;
class UpdateTableTaskAndKpi1787394961227 {
    constructor() {
        this.name = 'UpdateTableTaskAndKpi1787394961227';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` date NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` varchar(20) NOT NULL`);
    }
}
exports.UpdateTableTaskAndKpi1787394961227 = UpdateTableTaskAndKpi1787394961227;
//# sourceMappingURL=1787394961227-UpdateTableTaskAndKpi.js.map