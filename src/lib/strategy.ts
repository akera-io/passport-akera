import {Strategy as PassportStrategy} from "passport-strategy";

import {connect} from "@akeraio/api";

export interface IAkeraServer {
  host: string,
  port: number,
  useSSL?: boolean
}

export interface IPassportAkeraOptions {
  usernameField?: string,
  passwordField?: string,
  server?: IAkeraServer,
  passReqToCallback?: boolean,
  invalidCredentials?: string,
  badRequestMessage?: string,
}

export class Strategy extends PassportStrategy {
  private options: IPassportAkeraOptions;
  private name: string;
  private customVerify: Function;

  public constructor(options: IPassportAkeraOptions, verify: Function) {
    super();

    if (!options || !options.server || !options.server.host || !options.server.port) {
      throw new Error("Akera authentication strategy requires server options");
    }

    this.options = this.setDefaults(options);

    this.name = "akera";
    this.customVerify = verify;
  }

  public async authenticate(req, options): Promise<void> {
    const username = this.getCredentials(req.body, this.options.usernameField)
      || this.getCredentials(req.query, this.options.usernameField);
    const password = this.getCredentials(req.body, this.options.passwordField)
      || this.getCredentials(req.query, this.options.passwordField);

    if (!username || !password) {
      return this.fail({
        message: this.options.badRequestMessage || "Missing credentials"
      }, 400);
    }

    const config = {
      host: this.options.server.host,
      port: this.options.server.port,
      user: username,
      passwd: password,
      useSSL: this.options.server.useSSL || false
    };

    try {
      const connection = await connect(config);
      await connection.disconnect();
      const user = {
        name: config.user
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
          message: options.invalidCredentials || err.message
        },
        401
      );
    }
  }

  private setDefaults(options: IPassportAkeraOptions): IPassportAkeraOptions {
    return {
      ...options,
      usernameField: options.usernameField || "username",
      passwordField: options.passwordField || "password",
    };
  }

  private getCredentials(lInfo, field): string | null {
    return !lInfo || !lInfo[field] ? lInfo[field] : null;
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