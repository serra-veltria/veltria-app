declare module 'passport-microsoft' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    provider: string;
    id: string;
    displayName: string;
    name?: {
      familyName?: string;
      givenName?: string;
    };
    emails?: Array<{ value: string; type?: string }>;
    photos?: Array<{ value: string }>;
    _json: {
      id: string;
      displayName: string;
      givenName?: string;
      surname?: string;
      mail?: string;
      userPrincipalName?: string;
    };
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    tenant?: string;
    authorizationURL?: string;
    tokenURL?: string;
    passReqToCallback?: boolean;
  }

  export type VerifyCallback = (err?: Error | null, user?: object | false, info?: object) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void;

  export class Strategy implements PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction | VerifyFunctionWithRequest);
    name: string;
    authenticate(req: Request, options?: object): void;
  }
}
