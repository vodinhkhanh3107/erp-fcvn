import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnContractTypeForUsser1787391892055 implements MigrationInterface {
    name = 'AddColumnContractTypeForUsser1787391892055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`contract_type\` enum ('trial', 'official', 'part_time') NOT NULL DEFAULT 'trial'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`contract_type\``);
    }

}
