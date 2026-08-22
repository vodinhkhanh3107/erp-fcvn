"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTableTaskAndKpi1787395047800 = void 0;
class UpdateTableTaskAndKpi1787395047800 {
    constructor() {
        this.name = 'UpdateTableTaskAndKpi1787395047800';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` date`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
    }
}
exports.UpdateTableTaskAndKpi1787395047800 = UpdateTableTaskAndKpi1787395047800;
//# sourceMappingURL=1787395047800-UpdateTableTaskAndKpi.js.map