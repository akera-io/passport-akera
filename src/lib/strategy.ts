import {Strategy as PassportStrategy} from 'passport-strategy';

import {connect} from '@akeraio/api';
import {Request} from "express";

export interface IAkeraServer {
  host: string,
  port: number,
  useSSL?: boolean
}

export interface IAkeraPassportOptions {
  usernameField?: string,
  passwordField?: string,
  server?: IAkeraServer,
  passReqToCallback?: boolean,
}

export interface IAkeraPassportAuthenticateOptions {
  invalidCredentials?: string,
  badRequestMessage?: string,
}

type VerifyFunction = (err, user, info?) => void;
type CustomVerifyFunction = (req, user, callback?: VerifyFunction) => void;

export class Strategy extends PassportStrategy {
  public get name(): string {
    return 'akera';
  }

  private options: IAkeraPassportOptions;

  private customVerify: CustomVerifyFunction;

  public constructor(options: IAkeraPassportOptions, verify?: CustomVerifyFunction) {
    super();

    if (!options || !options.server || !options.server.host || !options.server.port) {
      throw new Error('Akera authentication strategy requires server options');
    }

    this.options = this.setDefaults(options);

    this.customVerify = verify;
  }

  public async authenticate(req: Request, options?: IAkeraPassportAuthenticateOptions): Promise<void> {
    const username = this.getCredentials(req.body, this.options.usernameField)
      || this.getCredentials(req.query, this.options.usernameField);
    const password = this.getCredentials(req.body, this.options.passwordField)
      || this.getCredentials(req.query, this.options.passwordField);

    options = options || {};

    if (!username || !password) {
      return this.fail({
        message: options.badRequestMessage || 'Missing credentials',
      }, 400);
    }

    const config = {
      host: this.options.server.host,
      port: this.options.server.port,
      user: username,
      passwd: password,
      useSSL: this.options.server.useSSL || false,
    };

    try {
      const connection = await connect(config);
      await connection.disconnect();
      const user = {
        name: config.user,
      };

      if (!this.customVerify) {
        this.success(user);
        return;
      }

      if (this.options.passReqToCallback) {
        this.customVerify(req, user, (err, user, info) => this.verify(err, user, info));
        return;
      }

      this.customVerify(user, (err, user, info) => this.verify(err, user, info));
    } catch (err) {
      this.fail(
        {
          message: options.invalidCredentials || err.message,
        },
        401,
      );
    }
  }

  private setDefaults(options: IAkeraPassportOptions): IAkeraPassportOptions {
    return {
      ...options,
      usernameField: options.usernameField || 'username',
      passwordField: options.passwordField || 'password',
    };
  }

  private getCredentials(lInfo, field): string | null {
    return !lInfo || !lInfo[field] ? null : lInfo[field];
  }

  private verify(err, user, info): void {
    if (err) {
      this.error(err);
      return;
    }
    if (!user) {
      this.fail(info);
      return;
    }
    this.success(user, info);
  }
}
