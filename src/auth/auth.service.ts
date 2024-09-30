import { ForbiddenException,BadRequestException,GoneException, Injectable, Inject } from '@nestjs/common';
import { RegisterInput } from './dto/register.input';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { LoginInput } from './dto/login.input';
import { biometricLogin } from './dto/biometric.login';
import jwtConfig from '../common/config/jwt.config';
import { randomUUID } from 'crypto';
import { ActiveUserData } from '../common/interfaces/active-user-data.interface';
import { User } from '../user/user-entity';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';


@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    @InjectRepository(User)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerInput: RegisterInput) {
    const exists = await this.prismaService.user.findUnique({
      where: { email: registerInput.email },
    });
    if (exists) {
      throw new ForbiddenException('User already exists');
    }
    const hashedPassword = await argon.hash(registerInput.password);
    const user = await this.prismaService.user.create({
      data: {
        email: registerInput.email,
        password: hashedPassword,
      },
    });
     return this.generateAuthToken(user);
  }

  async login(loginInput: LoginInput) {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginInput.email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordCorrect = await argon.verify(user.password, loginInput.password);
    if (!isPasswordCorrect) {
      throw new BadRequestException('Invalid Credentials');
    }
     return this.generateAuthToken(user);
  }

  async biometricLogin(biometricLogin: biometricLogin) {
    if (!biometricLogin?.biometricKey) {
        throw new BadRequestException('Biometric Key is required');
    }
    const user = await this.prismaService.user.findUnique({
        where: { biometricKey: biometricLogin.biometricKey },
    });

    if (user) {
        throw new GoneException('User Login Successfully');
    }
   
   return this.generateAuthToken(user);

}

async generateAuthToken(user: Partial<User>) {
  const token = randomUUID();

  await this.redisService.insert(`user-${user.id}`, token);

  const accessToken = await this.jwtService.signAsync(
    {
      id: user.id,
      email: user.email,
      token
    } as ActiveUserData,
    {
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.expire
    },
  );

  return { ...user, accessToken };
}
}
