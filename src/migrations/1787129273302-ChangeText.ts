import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeText1787129273302 implements MigrationInterface {
    name = 'ChangeText1787129273302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`notes\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`notes\``);
    }

}
