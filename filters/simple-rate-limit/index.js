"use strict";

var RateLimiter = require('limiter').RateLimiter;
var util = require("util");


function RateLimitExceeded(message) {
  Error.captureStackTrace(this, this.constructor);
  this.status = 421;
  this.name = this.constructor.name;
  this.message = "Too many requests !!!";
}
util.inherits(RateLimitExceeded, Error);


/**
 * Simple rate limit implementation. Limits can be applied to a provider or a
 * provider's operation and for all or a given consumer.
 * Allowed configuration properties:
 *
 * @example
 * {
 *   "consumers" : {
 *     "userA" : "passA"
 *   }
 * }
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filter configuration
 * @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  // if (!config || !config.consumers || Object.keys(config.consumers).length === 0) {
  //   throw new Error("'simple-rate-limit': Invalid filter parameters !!!");
  // }

  var globalLimiter = new RateLimiter(150, 'hour');
  var providerLimiter = {};

  function getProviderLimiter(provider) {
    var limiter = providerLimiter[req.provider];
    if(!limiter) {
      limiter = new RateLimiter(150, 'hour');
      providerLimiter[req.provider] = limiter;
    }
    return limiter;
  }

  // req.user is undefined if there is no user authenticated.
  return function(req, res, next) {

    if (!req.provider && !req.user) {
      //
      // Global rate limit
      //
      globalLimiter.removeTokens(1, function(err, remainingRequests) {
        if(err || remainingRequests === -1) {
          // Throw error rate limit exceeded
          next(new RateLimitExceeded());
        }
        next();
      }, true);

    } else if (req.provider && !req.user) {
      //
      // Provider rate limited no matter of user
      //
      var limiter = getProviderLimiter(req.provider);
      limiter.removeTokens(1, function(err, remainingRequests) {
        if(err || remainingRequests === -1) {
          // Throw error rate limit exceeded
          next(new RateLimitExceeded());
        }
        next();
      }, true);

    } else if (!req.provider && req.user) {
      //
      // User rate limited no matter of provider
      //

    } else if(req.provider && req.user) {
      //
      // Provider rate limited by user
      //

      // Apply limit on the provider
      var limiter = getProviderLimiter(req.provider);
      limiter.removeTokens(1, function(err, remainingRequests) {
        if(err || remainingRequests === -1) {
          // Throw error rate limit exceeded
          next(new RateLimitExceeded());
        }
        next();
      }, true);

      // Apply limit on the user
    }

    console.log("----> RATE_LIMIT ", req.user, req.provider);

    next();
  };

  
};
