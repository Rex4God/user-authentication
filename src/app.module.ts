import { Module } from '@nestjs/common';
import { AppResolver} from './app.resolver';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import {PrismaModule} from './prisma/prisma.module'
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './common/config/app.config';
import jwtConfig from './common/config/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { config } from 'process';
import {RootResolver} from './root.resolver'
import { RedisModule } from './redis/redis.module';
import redisConfig from './common/config/redis.config';


@Module({
  imports: [
    ConfigModule.forRoot({
       isGlobal: true,
       load: [appConfig, jwtConfig, redisConfig],
       }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: ConfigService) => {
        return {
          cors: {
            origin: config.get<string>('CLIENT_URL'),
          },
          autoSchemaFile: join(
            process.cwd(),
            config.get<string>('SCHEMA_PATH'),
          ),
          sortSchema: true,
          playground: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    RedisModule
  ],
  providers: [
    AppResolver,
    AppService,
    PrismaService,
    RootResolver,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
