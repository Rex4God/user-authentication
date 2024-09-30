import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import jwtConfig from '../common/config/jwt.config';


@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  providers: [
    AuthResolver,
    AuthService,
    PrismaService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
