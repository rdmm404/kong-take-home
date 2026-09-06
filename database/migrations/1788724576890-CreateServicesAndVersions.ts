import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServicesAndVersions1788724576890 implements MigrationInterface {
    name = 'CreateServicesAndVersions1788724576890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "versions" ("id" SERIAL NOT NULL, "service_id" integer NOT NULL, "version" character varying(255) NOT NULL, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_versions_service_id_version" UNIQUE ("service_id", "version"), CONSTRAINT "PK_921e9a820c96cc2cd7d4b3a107b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_versions_created_at" ON "versions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_versions_service_id" ON "versions" ("service_id") `);
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "name" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_services_created_at" ON "services" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_services_tenant_id" ON "services" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "versions" ADD CONSTRAINT "FK_961b0fd5ea2634e21a6ef6faed7" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "versions" DROP CONSTRAINT "FK_961b0fd5ea2634e21a6ef6faed7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_services_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_services_created_at"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_versions_service_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_versions_created_at"`);
        await queryRunner.query(`DROP TABLE "versions"`);
    }

}
