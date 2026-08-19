import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTextColumn1787129709743 implements MigrationInterface {
    name = 'RemoveTextColumn1787129709743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }

}
