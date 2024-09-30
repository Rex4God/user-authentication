import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

@InputType()
export class biometricLogin {
  @IsNotEmpty()
  @IsString()
  @MinLength(64, { message: 'Biometric key must be at least 64 characters long.' }) 
  @MaxLength(128, { message: 'Biometric key must be no more than 128 characters long.' })
  @Matches(/^[a-zA-Z0-9+/=]*$/, { message: 'Biometric key must be a valid Base64 string.' })
  @Field()
  biometricKey: string;
}
