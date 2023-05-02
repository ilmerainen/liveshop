import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMsgLike1682957147941 implements MigrationInterface {
  name = 'CreateMsgLike1682957147941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "msg_like" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "messageId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_20ac170a0c9c337e2fbaaad9c1a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3e500395ea62af4192fa67a984" ON "msg_like" ("messageId", "userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "msg_like" ADD CONSTRAINT "FK_e969c74792cc19ee2c9c7ff9244" FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "msg_like" ADD CONSTRAINT "FK_3d3fac51c3c8cdde28c5bcd27e3" FOREIGN KEY ("userId") REFERENCES "chat_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "msg_like" DROP CONSTRAINT "FK_3d3fac51c3c8cdde28c5bcd27e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "msg_like" DROP CONSTRAINT "FK_e969c74792cc19ee2c9c7ff9244"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e500395ea62af4192fa67a984"`,
    );
    await queryRunner.query(`DROP TABLE "msg_like"`);
  }
}
