import { MigrationInterface, QueryRunner } from 'typeorm';

export class chatEntities1680668937952 implements MigrationInterface {
  name = 'chatEntities1680668937952';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "role" character varying NOT NULL, "blocked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_15d83eb496fd7bec7368b30dbf3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_message" ("id" SERIAL NOT NULL, "chatId" character varying NOT NULL, "userId" uuid NOT NULL, "content" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d2db5b1118d92e561f5ebc1af" ON "chat_message" ("chatId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a44ec486210e6f8b4591776d6f" ON "chat_message" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3" FOREIGN KEY ("userId") REFERENCES "chat_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a44ec486210e6f8b4591776d6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d2db5b1118d92e561f5ebc1af"`,
    );
    await queryRunner.query(`DROP TABLE "chat_message"`);
    await queryRunner.query(`DROP TABLE "chat_user"`);
    await queryRunner.query(`DROP TABLE "chat"`);
  }
}
