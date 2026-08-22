import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTableTaskAndKpi1787395047800 implements MigrationInterface {
    name = 'UpdateTableTaskAndKpi1787395047800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`kpis\` ADD \`period\` date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`kpis\` DROP COLUMN \`period\``);
    }

}
