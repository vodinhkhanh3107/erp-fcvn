"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveTextColumn1787129709743 = void 0;
class RemoveTextColumn1787129709743 {
    constructor() {
        this.name = 'RemoveTextColumn1787129709743';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }
}
exports.RemoveTextColumn1787129709743 = RemoveTextColumn1787129709743;
//# sourceMappingURL=1787129709743-RemoveTextColumn.js.map