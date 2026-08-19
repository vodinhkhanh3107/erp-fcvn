"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPhoneToUsers1787127189002 = void 0;
class AddPhoneToUsers1787127189002 {
    constructor() {
        this.name = 'AddPhoneToUsers1787127189002';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
}
exports.AddPhoneToUsers1787127189002 = AddPhoneToUsers1787127189002;
//# sourceMappingURL=1787127189002-AddPhoneToUsers.js.map