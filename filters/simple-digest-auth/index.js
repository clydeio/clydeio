"use strict";

var connect = require("connect");
var passport = require("passport");
var DigestStrategy = require("passport-http").DigestStrategy;


/**
 * Simple digest authentication implementation based on passport-http.
 * Allowed configuration properties:
 *
 * @example
 * {
 *   "realm" : "clyde",
 *   "consumers" : {
 *     "userA" : "passA"
 *   }
 * }
 *
 * Only the "consumers" property is required and must contains at least one
 * consumer.
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filter configuration
 * @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  if (!config || !config.consumers || Object.keys(config.consumers).length === 0) {
    throw new Error("'simple-digest-auth': Invalid filter parameters !!! At least one consumer must be specified");
  }

  var middleware = connect();

  // Use digest strategy to authenticate users
  passport.use(new DigestStrategy({
      realm: config.realm || "clyde"
    },
    function(username, done) {
      // Get password for the given username from the consumers configuration
      var consumerPassword = config.consumers[username];
      if (consumerPassword) {
        return done(null, {
          username: username,
          password: consumerPassword
        }, consumerPassword);
      }

      return done(null, false);
    }
  ));

  // Set the middleware chain
  middleware.use(passport.initialize());
  middleware.use(passport.authenticate("digest", {session: false, failWithError: true}));

  return middleware;
};
