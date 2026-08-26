import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteColumnText1787652512897 implements MigrationInterface {
    name = 'DeleteColumnText1787652512897'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NOT NULL`);
    }

}
