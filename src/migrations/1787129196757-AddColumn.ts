import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumn1787129196757 implements MigrationInterface {
    name = 'AddColumn1787129196757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`notes\` varchar(100) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text3\``);
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`notes\``);
    }

}
