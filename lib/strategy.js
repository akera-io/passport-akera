'use strict';

/**
 * Passport wrapper for Akera
 */
var passport = require('passport-strategy');
var util = require('util');
var akeraApi = require('akera-api');

var Strategy = function(options, verify) {
  if (!options || !options.server || !options.server.host
      || !options.server.port) {
    throw new Error('Akera authentication strategy requires server options');
  }

  this.options = null;
  
  if (typeof options === 'object') {
    this.options = setDefaults(options);
  }

  passport.Strategy.call(this);

  this.name = 'akeraAuth';
  this.verify = verify;
};

util.inherits(Strategy, passport.Strategy);

var setDefaults = function(options) {
  if (options && typeof options === 'object') {
    options.usernameField = options.usernameField || 'username';
    options.passwordField = options.passwordField || 'password';
  }

  return options;
};

var verify = function() {
  return function(err, user, info) {
    if (err)
      return this.error(err);
    if (!user)
      return this.fail(info);
    return this.success(user, info);
  }.bind(this);
};

var getCredentials = function(lInfo, field) {
  if (!lInfo)
    return null;
  if (!lInfo[field])
    return null;
  if (lInfo[field])
    return lInfo[field];
  return null;
};

Strategy.prototype.authenticate = function(req, options) {
  var username, password;
  var self = this;

  options = options || {};

  username = getCredentials(req.body, this.options.usernameField)
      || getCredentials(req.query, this.options.usernameField);
  password = getCredentials(req.body, this.options.passwordField)
      || getCredentials(req.query, this.options.passwordField);

  if (!username || !password) {
    return this.fail({
      message : options.badRequestMessage || 'Missing credentials'
    }, 400);
  }

  var config = {
    host : this.options.server.host,
    port : this.options.server.port,
    user : username,
    passwd : password,
    useSSL : this.options.server.useSSL || false
  };

  akeraApi.connect(config).then(function(conn) {

    conn.disconnect().then(function() {
      var user = {
        name : config.user
      };

      if (self.verify) {
        if (self.options.passReqToCallback) {
          return self.verify(req, user, verify.call(this));
        } else {
          return self.verify(user, verify.call(this));
        }
      } else {
        return self.success(user);
      }
    });
  }, function(err) {
    self.fail({
      message : options.invalidCredentials || err.message
    });
  });
};

module.exports = Strategy;