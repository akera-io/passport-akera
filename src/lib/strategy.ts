import {Strategy as PassportStrategy} from 'passport-strategy';

import {connect, IConnection} from '@akeraio/api';
import {ConnectInfo} from '@akeraio/net';
import {Request} from "express";

export interface IAkeraServer {
  host: string,
  port: number,
  useSSL?: boolean
}

export interface IAkeraPassportOptions {
  name?: string,
  usernameField?: string,
  passwordField?: string,
  server?: IAkeraServer,
  broker?: IConnection,
  passReqToCallback?: boolean,
}

export interface IAkeraPassportAuthenticateOptions {
  invalidCredentials?: string,
  badRequestMessage?: string,
}

export interface IAkeraUser {
  name: string
}

type VerifyFunction = (err: Error | null, user: IAkeraUser, info?) => void;
type CustomVerifyFunction = (req: IAkeraUser | Request, user: IAkeraUser | VerifyFunction, callback?: VerifyFunction) => void;

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

  private _getConnection(req: Request, options?: IAkeraPassportAuthenticateOptions): Promise<IConnection> {
    if (this.options.broker) {
      return Promise.resolve(this.options.broker);
    }

    const username = this.getCredentials(req.body, this.options.usernameField)
      || this.getCredentials(req.query, this.options.usernameField);
    const password = this.getCredentials(req.body, this.options.passwordField)
      || this.getCredentials(req.query, this.options.passwordField);

    options = options || {};

    if (!username || !password) {
      this.fail({
        message: options.badRequestMessage || 'Missing credentials',
      }, 400);
      return;
    }

    const config: ConnectInfo = {
      host: this.options.server.host,
      port: this.options.server.port,
      ssl: this.options.server.useSSL || false,
    };

    return connect(config, username, password);
  }

  public async authenticate(req: Request, options?: IAkeraPassportAuthenticateOptions): Promise<void> {
    try {
      const username = this.getCredentials(req.body, this.options.usernameField)
        || this.getCredentials(req.query, this.options.usernameField);

      const connection = await this._getConnection(req, options);
      await connection.disconnect();
      const user: IAkeraUser = {
        name: username,
      };

      if (!this.customVerify) {
        this.success(user);
        return;
      }

      if (this.options.passReqToCallback) {
        this.customVerify(req, user, (err: Error, user: IAkeraUser, info?) => this.verify(err, user, info));
        return;
      }

      this.customVerify(user, (err: Error, user: IAkeraUser, info?) => this.verify(err, user, info));
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

  private getCredentials(lInfo: IAkeraPassportAuthenticateOptions, field: string): string | null {
    return !lInfo || !lInfo[field] ? null : lInfo[field];
  }

  private verify(err: Error | null, user: IAkeraUser, info): void {
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
