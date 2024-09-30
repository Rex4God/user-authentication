// src/root.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class RootResolver {
  @Query(() => String)
  sayHello(): string {
    return 'Hello, World!';
  }
}
