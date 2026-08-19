import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeContraintText1787129881629 implements MigrationInterface {
    name = 'ChangeContraintText1787129881629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` CHANGE \`text\` \`text\` varchar(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`supplier_groups\` CHANGE \`text\` \`text\` varchar(100) NULL`);
    }

}
