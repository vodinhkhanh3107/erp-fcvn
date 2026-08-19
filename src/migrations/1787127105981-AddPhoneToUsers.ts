import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneToUsers1787127105981 implements MigrationInterface {
    name = 'AddPhoneToUsers1787127105981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` ADD \`text\` varchar(100) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` DROP COLUMN \`text\``);
    }

}
