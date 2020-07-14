import {Strategy as PassportStrategy} from 'passport-strategy';

import {connect, IBrokerConfig, IConnection} from '@akeraio/api';
import {ConnectInfo} from '@akeraio/net';
import {Request} from "express";

/**
 * The configuration options used by the @akeraio/passport module.
 */
export interface IAkeraPassportOptions {
  /**
   * The field used to extract the username from the request body or query parameter.
   */
  usernameField?: string,
  /**
   * The field used to extract the password from the request body or query parameter.
   */
  passwordField?: string,
  /**
   * Akera broker configuration parameters.
   */
  server?: IBrokerConfig,
  /**
   * Should the reques object be passed to the authentication callback?
   */
  passReqToCallback?: boolean,
}

/**
 * Passport authentication configuration options.
 */
export interface IAkeraPassportAuthenticateOptions {
  /**
   * The message sent to the user when invalid credentials are passed.
   */
  invalidCredentials?: string,
  /**
   * The message sent to the user when a bad request happens.
   */
  badRequestMessage?: string,
}

/**
 * The response sent back to the application describing an authenticated used.
 */
export interface IAkeraUser {
  /**
   * The name of the user.
   */
  name: string
}

/**
 * Verification function used by the passport strategy.
 *
 * @param err The error to be sent to the user.
 * @param user Basic information about the user.
 * @param [info] Additional information about the user.
 */
type VerifyFunction = (err: Error | null, user: IAkeraUser, info?) => void;
/**
 * A custom validation/verification function sent by the application that checks if a user is valid or not.
 *
 * @param req The request object.
 * @param user The user object.
 * @param callback The verification function used by passport.
 */
type CustomVerifyFunction = (req: IAkeraUser | Request, user: IAkeraUser | VerifyFunction, callback?: VerifyFunction) => void;

export class Strategy extends PassportStrategy {
  /**
   * The name of the strategy.
   */
  public get name(): string {
    return 'akera';
  }

  /**
   * The configuration options used by the strategy.
   */
  private options: IAkeraPassportOptions;

  /**
   * The custom verification/validation function passed by the application.
   */
  private customVerify: CustomVerifyFunction;

  /**
   * The strategy constructor.
   *
   * @param options The configuration options used by the strategy.
   * @param verify The custom verification function.
   */
  public constructor(options: IAkeraPassportOptions, verify?: CustomVerifyFunction) {
    super();

    if (!options || !options.server || !options.server.host || !options.server.port) {
      throw new Error('Akera authentication strategy requires server options');
    }

    this.options = this.setDefaults(options);

    this.customVerify = verify;
  }

  /**
   * Returns a new connection to the akera server.
   *
   * @param req The request object.
   * @param options The passport authentication options.
   */
  private _getConnection(req: Request, options?: IAkeraPassportAuthenticateOptions): Promise<IConnection> {
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

  /**
   * Passport authentication method. This method is called when the application tries to authenticate a user.
   *
   * @param req The request object.
   * @param options The passport authentication options.
   */
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

  /**
   * Sets the default configuration option values.
   *
   * @param options The options passed by the application.
   */
  private setDefaults(options: IAkeraPassportOptions): IAkeraPassportOptions {
    return {
      ...options,
      usernameField: options.usernameField || 'username',
      passwordField: options.passwordField || 'password',
    };
  }

  /**
   * Returns the credentials values from the request body or query parameters.
   *
   * @param lInfo The list with values from where to extract the values.
   * @param field The name of the field we want to extract.
   */
  private getCredentials(lInfo: any, field: string): string | null {
    return !lInfo || !lInfo[field] ? null : lInfo[field];
  }

  /**
   * Calls various passport methods to notify if the authentication was successful or if it failed.
   *
   * @param err The error message.
   * @param user The basic user information.
   * @param [info] Additional user information.
   */
  private verify(err: Error | null, user: IAkeraUser, info?): void {
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
