"use strict";

var connect = require("connect");
var passport = require("passport");
var BasicStrategy = require("passport-http").BasicStrategy;
var DigestStrategy = require("passport-http").DigestStrategy;


/**
 * Simple HTTP authentication for basic and digest methods. Implementation based
 * on passport-http.
 * Allowed configuration properties:
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filter configuration
 * @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  if (!config || !config.consumers || Object.keys(config.consumers).length === 0) {
    throw new Error("'simple-http-auth': Invalid filter parameters !!! At least one consumer must be specified");
  }
  if (!config.method) {
    throw new Error("'simple-http-auth': An authentication method must be specified !!!");
  } else if (config.method !== "basic" && config.method !== "digest") {
    throw new Error("'simple-http-auth': Allowed authentication methods: 'basic' and 'digest'.");
  }

  var middleware = connect();

  // Use basic strategy to authenticate users
  if (config.method === "basic") {
    passport.use(new BasicStrategy({
        realm: config.realm || "clyde"
      },
      function(userid, password, done) {
        // Get password for the given userid from the consumers configuration
        var consumerPassword = config.consumers[userid];
        if (password === consumerPassword) {
          return done(null, {
            userid: userid,
            password: password
          });
        }

        return done(null, false);
      }
    ));
  }

  // Use digest strategy to authenticate users
  if (config.method === "digest") {
    passport.use(new DigestStrategy({
        realm: config.realm || "clyde"
      },
      function(username, done) {
        // Get password for the given username from the consumers configuration
        var consumerPassword = config.consumers[username];
        if (consumerPassword) {
          return done(null, {
            userid: username,
            password: consumerPassword
          }, consumerPassword);
        }

        return done(null, false);
      }
    ));
  }

  // Set the middleware chain
  middleware.use(passport.initialize());
  middleware.use(passport.authenticate(config.method, {session: false, failWithError: true}));

  return middleware;
};
