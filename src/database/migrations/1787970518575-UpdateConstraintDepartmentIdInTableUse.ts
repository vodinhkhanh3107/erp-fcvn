import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConstraintDepartmentIdInTableUse1787970518575 implements MigrationInterface {
    name = 'UpdateConstraintDepartmentIdInTableUse1787970518575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_0921d1972cf861d568f5271cd85\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`department_id\` \`department_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_0921d1972cf861d568f5271cd85\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_0921d1972cf861d568f5271cd85\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`department_id\` \`department_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_0921d1972cf861d568f5271cd85\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
