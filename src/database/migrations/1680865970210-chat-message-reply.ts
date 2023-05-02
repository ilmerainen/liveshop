import { MigrationInterface, QueryRunner } from 'typeorm';

export class chatMessageReply1680865970210 implements MigrationInterface {
  name = 'chatMessageReply1680865970210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" ADD "replyTo" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6b0b41e25ee7e8d10e56600c3d" ON "chat_message" ("replyTo") `,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_6b0b41e25ee7e8d10e56600c3de" FOREIGN KEY ("replyTo") REFERENCES "chat_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_6b0b41e25ee7e8d10e56600c3de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b0b41e25ee7e8d10e56600c3d"`,
    );
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "replyTo"`);
  }
}
