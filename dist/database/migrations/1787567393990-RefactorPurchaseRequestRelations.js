"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorPurchaseRequestRelations1787567393990 = void 0;
class RefactorPurchaseRequestRelations1787567393990 {
    constructor() {
        this.name = 'RefactorPurchaseRequestRelations1787567393990';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` CHANGE \`period\` \`period\` date NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`kpis\` CHANGE \`period\` \`period\` date NULL`);
    }
}
exports.RefactorPurchaseRequestRelations1787567393990 = RefactorPurchaseRequestRelations1787567393990;
//# sourceMappingURL=1787567393990-RefactorPurchaseRequestRelations.js.map