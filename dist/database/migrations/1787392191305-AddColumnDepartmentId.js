"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddColumnDepartmentId1787392191305 = void 0;
class AddColumnDepartmentId1787392191305 {
    constructor() {
        this.name = 'AddColumnDepartmentId1787392191305';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`department_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_0921d1972cf861d568f5271cd85\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_0921d1972cf861d568f5271cd85\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`department_id\``);
    }
}
exports.AddColumnDepartmentId1787392191305 = AddColumnDepartmentId1787392191305;
//# sourceMappingURL=1787392191305-AddColumnDepartmentId.js.map