"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteColumnText1787652512897 = void 0;
class DeleteColumnText1787652512897 {
    constructor() {
        this.name = 'DeleteColumnText1787652512897';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
    }
}
exports.DeleteColumnText1787652512897 = DeleteColumnText1787652512897;
//# sourceMappingURL=1787652512897-DeleteColumnText.js.map