import { Module } from '@nestjs/common';
import { join } from 'path';
import databaseConfig from './modules/config/database.config';
import authConfig from './modules/config/auth.config';
import appConfig from './modules/config/app.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HomeModule } from './modules/home/home.module';
import { DataSource } from 'typeorm';
import { ChatModule } from './modules/chat/chat.module';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'view/chat'),
      // serveRoot: 'static',
      // renderPath: 'static'
    }),
    HomeModule,
    ChatModule,
  ],
  providers: [],
})
export class AppModule {}
