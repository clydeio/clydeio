"use strict";

var RateLimiter = require('limiter').RateLimiter;
var util = require("util");


function RateLimitExceeded(description) {
  Error.captureStackTrace(this, this.constructor);
  this.status = 421;
  this.name = this.constructor.name;
  this.message = "Too many requests !!!";
  if (description) {
    this.message += " " + description;
  }
}
util.inherits(RateLimitExceeded, Error);


/**
 * Simple rate limit implementation. Limits can be applied to a provider or a
 * provider's operation and for all or a given consumer.
 * Allowed configuration properties:
 *
 * @example
 * { 
 *   "global" : {
 *     "tokens" : 150,
 *     "interval" : "hour"
 *   },
 * 
 *   "consumers" : {
 *     "userA" : {
 *       "tokens" : 150,
 *       "interval" : "hour"
 *     }
 *   },
 * 
 *   "providers" : {
 *     "providerA" : {
 *       "global" : {
 *         "tokens" : 150,
 *         "interval" : "hour"
 *       },
 * 
 *       "consumers" : {
 *         "userA" : {
 *           "tokens" : 150,
 *           "interval" : "hour"
 *         }
 *       }            
 *     }
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
  var hasConsumers = config.consumers && Object.keys(config.consumers).length > 0;
  var hasProviders = config.providers && Object.keys(config.providers).length > 0;
  if (!config || (!config.global && !hasConsumers && !hasProviders) ) {
    throw new Error("'simple-rate-limit': Invalid filter parameters !!! At least one global, consumer or provider must be specified.");
  }

  /**
   * Global rate limiter.
   *
   * @type {Object}
   */
  var globalLimiter;
  /**
   * Stores the limiter for each provider and the concrete limiter of each
   * provider's user:
   *
   * {
   *   providerA: {
   *     global: [provider limiter],
   *     consumers: {
   *       userA: [userA limiter],
   *       userB: [userB limiter],
   *       ...
   *     }
   *   }
   * }
   * 
   * @type {Object}
   */
  var providersLimiters = {};
  /**
   * Stores the limiter of each user, when the limit is applied to the user no
   * matter which provider queries:
   *
   * {
   *   userA: [userA limiter],
   *   userB: [userB limiter],
   *   ...
   * }
   * 
   * @type {Object}
   */
  var consumersLimiters = {};


  function initializeLimiters(config) {

    var parseGlobal = function(cfg) {
      var limiter;
      if (cfg.global) {
        limiter = new RateLimiter(cfg.global.tokens, cfg.global.interval);
      }
      return limiter;
    };

    var parseConsumers = function(cfg) {
      var prop, limitConfig, limiters = {};
      if (cfg.consumers) {
        for (prop in cfg.consumers) {
          limitConfig = cfg.consumers[prop];
          limiters[prop] = new RateLimiter(limitConfig.tokens, limitConfig.interval)
        }
      }
      return limiters;
    };

    var parseProviders = function(cfg) {
      var prop, limitConfig, limiters = {};
      if (cfg.providers) {
        for (prop in cfg.providers) {
          limitConfig = cfg.providers[prop];
          limiters[prop] = {};

          if (limitConfig.global) {
            limiters[prop].global = parseGlobal(limitConfig);
          }

          if (limitConfig.consumers) {
            limiters[prop].consumers = parseConsumers(limitConfig.consumers);
          }
        }
      }
      return limiters;
    };

    globalLimiter = parseGlobal(config);
    consumersLimiters = parseConsumers(config);
    providersLimiters = parseProviders(config);
  }

  // function getProviderLimiter(provider) {
  //   if (providerLimiter[provider]) {

  //   }

  //   var limiter = providerLimiter[provider];
  //   if(!limiter) {
  //     limiter = new RateLimiter(150, 'hour');
  //     providerLimiter[provider] = limiter;
  //   }
  //   return limiter;
  // }

  // function getUserLimiter(userid) {
  //   var limiter = userLimiter[userid];
  //   if(!limiter) {
  //     limiter = new RateLimiter(150, 'hour');
  //     userLimiter[userid] = limiter;
  //   }
  //   return limiter;
  // }

  // function getUserProviderLimiter(provider, userid) {
  //   // TODO
  // }

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
          next(new RateLimitExceeded("Provider quota exceeded."));
        }
        next();
      }, true);

    } else if (!req.provider && req.user) {

      //
      // User rate limited no matter of provider
      //

      var limiter = getUserLimiter(req.provider);
      limiter.removeTokens(1, function(err, remainingRequests) {
        if(err || remainingRequests === -1) {
          // Throw error rate limit exceeded
          next(new RateLimitExceeded("User quota exceeded."));
        }
        next();
      }, true);
    } else if(req.provider && req.user) {

      //
      // Provider rate limited by user
      //

      // Chck limit on the provider
      var limiter = getProviderLimiter(req.provider);
      limiter.removeTokens(1, function(err, remainingRequests) {
        if(err || remainingRequests === -1) {
          // Throw error rate limit exceeded
          next(new RateLimitExceeded());
        }

        // Check limit on the user

        next();
      }, true);

      // Apply limit on the user
    }

    console.log("----> RATE_LIMIT ", req.user, req.provider);

    next();
  };

  
};
