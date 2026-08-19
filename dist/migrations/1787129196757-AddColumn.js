"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddColumn1787129196757 = void 0;
class AddColumn1787129196757 {
    constructor() {
        this.name = 'AddColumn1787129196757';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`notes\` varchar(100) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text3\``);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`notes\``);
    }
}
exports.AddColumn1787129196757 = AddColumn1787129196757;
//# sourceMappingURL=1787129196757-AddColumn.js.map