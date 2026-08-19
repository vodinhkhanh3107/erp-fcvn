"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPhoneToUsers1787127105981 = void 0;
class AddPhoneToUsers1787127105981 {
    constructor() {
        this.name = 'AddPhoneToUsers1787127105981';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
}
exports.AddPhoneToUsers1787127105981 = AddPhoneToUsers1787127105981;
//# sourceMappingURL=1787127105981-AddPhoneToUsers.js.map