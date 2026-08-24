import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPurchaseRequestRelations1787567393990 implements MigrationInterface {
    name = 'RefactorPurchaseRequestRelations1787567393990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`kpis\` CHANGE \`period\` \`period\` date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`kpis\` CHANGE \`period\` \`period\` date NULL`);
    }

}
