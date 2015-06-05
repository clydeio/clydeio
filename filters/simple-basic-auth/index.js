"use strict";

var connect = require("connect");
var passport = require("passport");
var BasicStrategy = require('passport-http').BasicStrategy;


/**
 * Simple basic authentication implementation based on passport-http. 
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
    throw new Error("'simple-basic-auth': Invalid filter parameters !!! At least one consumer must be specified");
  }

  var middleware = connect();

  // Use basic strategy to authenticate users
  passport.use(new BasicStrategy({
      realm: config.realm || "clyde"
    },
    function(userid, password, done) {
      // Get password for the given userid from the consumers configuration
      var consumerPassword = config.consumers[userid];
      if(password === consumerPassword) {
        return done(null, {
          username: userid, 
          password: password
        });
      }

      return done(null, false);
    }
  ));

  // Set the middleware chain
  middleware.use(passport.initialize());
  middleware.use(passport.authenticate("basic", {session: false}));
  
  return middleware;
}
