"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeText1787129273302 = void 0;
class ChangeText1787129273302 {
    constructor() {
        this.name = 'ChangeText1787129273302';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`notes\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`notes\``);
    }
}
exports.ChangeText1787129273302 = ChangeText1787129273302;
//# sourceMappingURL=1787129273302-ChangeText.js.map