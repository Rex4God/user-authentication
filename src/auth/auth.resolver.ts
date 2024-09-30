import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { RegisterInput} from './dto/register.input'

import { LoginInput } from './dto/login.input';
import {biometricLogin} from './dto/biometric.login'
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Auth} from './entities/auth.entity'




@Resolver("Auth")
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => Auth )
  async register(@Args('registerInput') registerInput: RegisterInput) {
    return this.authService.register(registerInput);
  }

  @Public()
  @Mutation(() => Auth )
  login(@Args('loginInput') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }
  
  @Public()
  @Mutation(() => Auth)
  biometricLogin(@Args('biometricKey') biomtericLogin: biometricLogin){
    return this.authService.biometricLogin(biomtericLogin);
  
  }
}
