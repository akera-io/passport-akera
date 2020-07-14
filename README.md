# passport-akera

[Passport](http://passportjs.org/) authentication strategy against Akera.io application server. 
This module is a Passport strategy wrapper for [@akera/api](http://akera.io)

## Install

```
npm install @akeraio/passport
```

## Usage

### Configure strategy

**Typescript**
```typescript
import {Strategy as AkeraStrategy} from "@akeraio/passport"; 
import * as passport from "passport";

passport.use(new AkeraStrategy({
    server: {
      host: 'localhost',
      port: 8383,
      useSSL: true
    },
    ...
  }));
```

**Javascript**
```javascript
const AkeraStrategy = require('@akeraio/passport').Strategy;

passport.use(new AkeraStrategy({
    server: {
      host: 'localhost',
      port: 8383,
      useSSL: true
    },
    ...
  }));
```


* `server`: Akera.io settings. These are passed directly to [@akera/api](http://akera.io) connect method. See its documentation for all available options.
    * `host`: Akera.io application server host name or ip address, e.g. `localhost`
    * `port`: Akera.io application server port number, e.g. `8383`
    * `useSSL`: Akera.io application server SSL connection flag
* `usernameField`: Field name where the user name is found, defaults to _username_
* `passwordField`: Field name where the password is found, defaults to _password_
* `passReqToCallback`: When `true`, `req` is the first argument to the verify callback (default: `false`):

        passport.use(new AkeraStrategy(..., function(req, user, done) {
            ...
            done(null, user);
          }
        ));

### Authenticate requests

Use `passport.authenticate()`, specifying the `'akera'` strategy, to authenticate requests.

#### `authenticate()` options

In addition to [default authentication options](http://passportjs.org/guide/authenticate/) the following flash message options are available for `passport.authenticate()`:

 * `badRequestMessage`: missing username/password (default: 'Missing credentials')
 * `invalidCredentials`: `InvalidCredentialsError` (default: error returned by akera-api connect)

## Express example

**Typescript**
```typescript
import express                     from "express";
import passport                    from "passport";
import {json, urlencoded}          from "body-parser";
import {Strategy as AkeraStrategy} from "@akeraio/passport";

const OPTS = {
  server: {
    host: 'localhost',
    port: '8383',
    useSSL: true
  }
};

const app = express();

passport.use(new AkeraStrategy(OPTS));

app.use(json());
app.use(urlencoded({extended: false}));
app.use(passport.initialize());

app.post('/login', passport.authenticate('akera', {session: false}), function(req, res) {
  res.send({status: 'ok'});
});

app.listen(8080);
```

**Javascript**
```javascript
const express      = require('express');
const passport     = require('passport');
const bodyParser   = require('body-parser');
const AkeraStrategy = require('passport-akera').Strategy;

const OPTS = {
  server: {
    host: 'localhost',
    port: '8383',
    useSSL: true
  }
};

const app = express();

passport.use(new AkeraStrategy(OPTS));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

app.post('/login', passport.authenticate('akera', {session: false}), function(req, res) {
  res.send({status: 'ok'});
});

app.listen(8080);
```

## License

MIT
