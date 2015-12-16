# passport-akera

[Passport](http://passportjs.org/) authentication strategy against Akera.io application server. 
This module is a Passport strategy wrapper for [akera-api](http://akera.io)

## Install

```
npm install passport-akera
```

## Usage

### Configure strategy

```javascript
var AkeraStrategy = require('passport-akera').Strategy;

passport.use(new AkeraStrategy({
    server: {
      host: 'localhost',
      port: 8383,
      useSSL: true
    },
    ...
  }));
```

* `server`: Akera.io settings. These are passed directly to [akera-api](http://akera.io) connect method. See its documentation for all available options.
    * `host`: Akera.io application server host name or ip address, e.g. `localhost`
    * `port`: Akera.io application server port number, e.g. `cn='root'`
    * `useSSL`: Akera.io application server SSL connection flag
* `usernameField`: Field name where the user name is found, defaults to _username_
* `passwordField`: Field name where the password is found, defaults to _password_
* `passReqToCallback`: When `true`, `req` is the first argument to the verify callback (default: `false`):

        passport.use(new LdapStrategy(..., function(req, user, done) {
            ...
            done(null, user);
          }
        ));

Note: you can pass a function instead of an object as `options`, see the [example below](#options-as-function)

### Authenticate requests

Use `passport.authenticate()`, specifying the `'akeraAuth'` strategy, to authenticate requests.

#### `authenticate()` options

In addition to [default authentication options](http://passportjs.org/guide/authenticate/) the following flash message options are available for `passport.authenticate()`:

 * `badRequestMessage`: missing username/password (default: 'Missing credentials')
 * `invalidCredentials`: `InvalidCredentialsError` (default: error returned by akera-api connect)

## Express example

```javascript
var express      = require('express'),
    passport     = require('passport'),
    bodyParser   = require('body-parser'),
    AkeraStrategy = require('passport-akera').Strategy;

var OPTS = {
  server: {
    host: 'localhost',
    port: '8383',
    useSSL: true
  }
};

var app = express();

passport.use(new AkeraStrategy(OPTS));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

app.post('/login', passport.authenticate('akeraAuth', {session: false}), function(req, res) {
  res.send({status: 'ok'});
});

app.listen(8080);
```

## License

MIT
