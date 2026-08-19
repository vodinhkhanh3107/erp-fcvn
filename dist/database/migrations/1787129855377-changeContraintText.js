"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeContraintText1787129855377 = void 0;
class ChangeContraintText1787129855377 {
    constructor() {
        this.name = 'ChangeContraintText1787129855377';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` CHANGE \`text\` \`text\` varchar(100) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` CHANGE \`text\` \`text\` varchar(100) NULL`);
    }
}
exports.ChangeContraintText1787129855377 = ChangeContraintText1787129855377;
//# sourceMappingURL=1787129855377-changeContraintText.js.map