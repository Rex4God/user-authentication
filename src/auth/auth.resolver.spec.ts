import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { biometricLogin } from './dto/biometric.login';
import { Auth } from './entities/auth.entity';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            biometricLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct arguments and return result', async () => {
      const registerInput: RegisterInput = { email: 'test@example.com', password: 'password123' };
      const result: Auth = { id: 1, accessToken: 'token' , email: 'test@example.com', password: 'password123', biometricKey:"someBiometricKey"}

      jest.spyOn(authService, 'register').mockResolvedValue(result);

      expect(await resolver.register(registerInput)).toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(registerInput);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct arguments and return result', async () => {
      const loginInput: LoginInput = { email: 'test@example.com', password: 'password123' };
      const result: Auth = { id: 1, accessToken: 'token' , email: 'test@example.com', password: 'password123', biometricKey:"someBiometricKey"}

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(await resolver.login(loginInput)).toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(loginInput);
    });
  });

  describe('biometricLogin', () => {
    it('should call authService.biometricLogin with correct arguments and return result', async () => {
      const biometricInput: biometricLogin  = { biometricKey: 'someBiometricKey' };
      const result: Auth = { id: 1, accessToken: 'token' , email: 'test@example.com', password: 'password123', biometricKey:"someBiometricKey"}

      jest.spyOn(authService, 'biometricLogin').mockResolvedValue(result);

      expect(await resolver.biometricLogin(biometricInput)).toEqual(result);
      expect(authService.biometricLogin).toHaveBeenCalledWith(biometricInput);
    });
  });
});
