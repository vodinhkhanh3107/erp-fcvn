import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnText1787130002911 implements MigrationInterface {
    name = 'AddColumnText1787130002911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }

}
