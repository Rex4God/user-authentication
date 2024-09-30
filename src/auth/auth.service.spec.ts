import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { ForbiddenException, BadRequestException, GoneException } from '@nestjs/common';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { biometricLogin } from './dto/biometric.login';
import * as argon from 'argon2';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../common/config/jwt.config';
import { randomUUID } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let jwtConfigMock: ConfigType<typeof jwtConfig>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            insert: jest.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: {
            secret: 'test-secret',
            expire: '1h',
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    jwtConfigMock = module.get(jwtConfig.KEY);
  });

  describe('register', () => {
    it('should throw ForbiddenException if user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        biometricKey: 'someBiometricKey',
        updatedAt: new Date('2024-09-12'),
        createdAt: new Date('2024-09-12'),
      });
      

      const registerInput: RegisterInput = { email: 'test@example.com', password: 'password123' };
      await expect(service.register(registerInput)).rejects.toThrow(ForbiddenException);
    });

    it('should create a new user and return token', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(argon, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        biometricKey: 'someBiometricKey',
        updatedAt: new Date('2024-09-12'),
        createdAt: new Date('2024-09-12'),
      });
      jest.spyOn(service, 'generateAuthToken').mockResolvedValue({ accessToken: 'token' });

      const registerInput: RegisterInput = { email: 'test@example.com', password: 'password123' };
      const result = await service.register(registerInput);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerInput.email,
          password: 'hashedPassword',
        },
      });
      expect(result).toEqual({ accessToken: 'token' });
    });
  });

  describe('login', () => {
    it('should throw BadRequestException if user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const loginInput: LoginInput = { email: 'test@example.com', password: 'password123' };
      await expect(service.login(loginInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findUnique');
      jest.spyOn(argon, 'verify').mockResolvedValue(false);

      const loginInput: LoginInput = { email: 'test@example.com', password: 'password123' };
      await expect(service.login(loginInput)).rejects.toThrow(BadRequestException);
    });

    it('should return token if login is successful', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        biometricKey: 'someBiometricKey',
        updatedAt: new Date('2024-09-12'),
        createdAt: new Date('2024-09-12'),
      });;
      jest.spyOn(argon, 'verify').mockResolvedValue(true);
      jest.spyOn(service, 'generateAuthToken').mockResolvedValue({ accessToken: 'token' });

      const loginInput: LoginInput = { email: 'test@example.com', password: 'password123' };
      const result = await service.login(loginInput);

      expect(result).toEqual({ accessToken: 'token' });
    });
  });

  describe('biometricLogin', () => {
    it('should throw BadRequestException if biometricKey is missing', async () => {
      const biometricInput: biometricLogin = { biometricKey: '' };
      await expect(service.biometricLogin(biometricInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if user is found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        biometricKey: 'someBiometricKey',
        updatedAt: new Date('2024-09-12'),
        createdAt: new Date('2024-09-12'),
      });;

      const biometricInput: biometricLogin = { biometricKey: 'key' };
      await expect(service.biometricLogin(biometricInput)).rejects.toThrow(GoneException);
    });

    it('should return token if biometric login is successful', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(service, 'generateAuthToken').mockResolvedValue({ accessToken: 'token' });

      const biometricInput: biometricLogin = { biometricKey: 'key' };
      const result = await service.biometricLogin(biometricInput);

      expect(result).toEqual({ accessToken: 'token' });
    });
  });

  describe('generateAuthToken', () => {
    it('should generate token and return user with access token', async () => {
      jest.spyOn(redisService, 'insert').mockResolvedValue(undefined);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('jwtToken');

      const user = { id: 1, email: 'test@example.com', password:"1233pgf" , biometricKey:"secrekey"};
      const result = await service.generateAuthToken(user);

      expect(redisService.insert).toHaveBeenCalledWith(`user-1`, 'randomUUID');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { id: 1, email: 'test@example.com', token: 'randomUUID' },
        { secret: jwtConfigMock.secret, expiresIn: jwtConfigMock.expire },
      );
      expect(result).toEqual({ ...user, accessToken: 'jwtToken' });
    });
  });
});
