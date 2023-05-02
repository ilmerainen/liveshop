import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageType1682987804650 implements MigrationInterface {
  name = 'AddMessageType1682987804650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."chat_message_type_enum" AS ENUM('sticker', 'text')`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD "type" "public"."chat_message_type_enum" NOT NULL DEFAULT 'text'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."chat_message_type_enum"`);
  }
}
