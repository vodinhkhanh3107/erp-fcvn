"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddColumnText1787130002911 = void 0;
class AddColumnText1787130002911 {
    constructor() {
        this.name = 'AddColumnText1787130002911';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
}
exports.AddColumnText1787130002911 = AddColumnText1787130002911;
//# sourceMappingURL=1787130002911-AddColumnText.js.map