"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddColumnContractTypeForUsser1787391892055 = void 0;
class AddColumnContractTypeForUsser1787391892055 {
    constructor() {
        this.name = 'AddColumnContractTypeForUsser1787391892055';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`contract_type\` enum ('trial', 'official', 'part_time') NOT NULL DEFAULT 'trial'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`contract_type\``);
    }
}
exports.AddColumnContractTypeForUsser1787391892055 = AddColumnContractTypeForUsser1787391892055;
//# sourceMappingURL=1787391892055-AddColumnContractTypeForUsser.js.map