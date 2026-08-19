"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddColumnText1787130799296 = void 0;
class AddColumnText1787130799296 {
    constructor() {
        this.name = 'AddColumnText1787130799296';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
}
exports.AddColumnText1787130799296 = AddColumnText1787130799296;
//# sourceMappingURL=1787130799296-AddColumnText.js.map