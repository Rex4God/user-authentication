import { ObjectType } from '@nestjs/graphql';

import { User } from '../../user/user-entity';

@ObjectType({ description: 'Auth Token Model' })
export class Auth extends User {
  accessToken: string;
}
