declare module 'passport-jwt' {
  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): (request: unknown) => string | null;
  };

  export class Strategy {
    constructor(options: {
      jwtFromRequest: (request: unknown) => string | null;
      ignoreExpiration?: boolean;
      secretOrKey: string;
    });
  }
}
