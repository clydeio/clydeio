"use strict";

var RateLimiter = require("limiter").RateLimiter;
var util = require("util");


/**
 * RateLimitExceeded error.
 *
 * @param {String} description Extended description
 * @returns {void}
 */
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

RateLimitExceeded.GLOBAL_LIMIT_EXCEEDED = "Global rate limit exceeded.";
RateLimitExceeded.PROVIDER_LIMIT_EXCEEDED = "Provider rate limit exceeded.";
RateLimitExceeded.CONSUMER_LIMIT_EXCEEDED = "Consumer rate limit exceeded.";
RateLimitExceeded.PROVIDER_CONSUMER_LIMIT_EXCEEDED = "Consumer quota on the provider exceeded.";


/**
 * Global rate limiter.
 *
 * @type {Object}
 */
var globalLimiter;
/**
 * Stores the limiter for each provider and the concrete limiter of each
 * provider's consumer:
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
 * Stores the limiter of each consumer, when the limit is applied to the
 * consumer no matter which provider queries:
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

/**
 * Initialize limiters from configuration.
 *
 * @param  {Object} config Configuration
 * @returns {void}
 */
function initializeLimiters(config) {

  function parseGlobal(cfg) {
    var limiter;
    if (cfg.global) {
      limiter = new RateLimiter(cfg.global.tokens, cfg.global.interval);
    }
    return limiter;
  }

  function parseConsumers(cfg) {
    var prop, limitConfig, limiters = {};
    if (cfg.consumers) {
      for (prop in cfg.consumers) {
        limitConfig = cfg.consumers[prop];
        limiters[prop] = new RateLimiter(limitConfig.tokens, limitConfig.interval);
      }
    }
    return limiters;
  }

  function parseProviders(cfg) {
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
  }

  // Parse configuration
  globalLimiter = parseGlobal(config);
  consumersLimiters = parseConsumers(config);
  providersLimiters = parseProviders(config);
}


/**
 * Apply global rate limits.
 *
 * @param  {Function} cb Callback.
 * @returns {void}
 */
function applyGlobalLimit(cb) {
  if (!globalLimiter) {
    cb();
  }

  globalLimiter.removeTokens(1, function(err, remainingRequests) {
    if (err || remainingRequests === -1) {
      // Throw error rate limit exceeded
      cb(new RateLimitExceeded(RateLimitExceeded.GLOBAL_LIMIT_EXCEEDED));
    }
    cb();
  }, true);
}


/**
 * Apply limits on consumers.
 *
 * @param  {String}   consumerId Consumer ID
 * @param  {Function} cb       Callback
 * @returns {void}
 */
function applyConsumerLimit(consumerId, cb) {
  if (!consumerId) {
    cb();
  }

  var limiter = consumersLimiters[consumerId.userid];
  if (!limiter) {
    cb();
  }

  limiter.removeTokens(1, function(err, remainingRequests) {
    if (err || remainingRequests === -1) {
      // Throw error rate limit exceeded
      cb(new RateLimitExceeded(RateLimitExceeded.CONSUMER_LIMIT_EXCEEDED));
    }
    cb();
  }, true);
}


/**
 * Apply limits on providers.
 *
 * @param  {String}   providerId Provider ID
 * @param  {Function} cb       Callback
 * @returns {void}
 */
function applyProviderLimit(providerId, cb) {
  if (!providerId) {
    cb();
  }

  var provider = providersLimiters[providerId];
  if (!provider || !provider.global) {
    cb();
  }

  provider.global.removeTokens(1, function(err, remainingRequests) {
    if (err || remainingRequests === -1) {
      // Throw error rate limit exceeded
      cb(new RateLimitExceeded(RateLimitExceeded.PROVIDER_LIMIT_EXCEEDED));
    }
    cb();
  }, true);
}


/**
 * Apply limits on a provider's consumer.
 *
 * @param  {String}   providerId Provider ID
 * @param  {String}   consumerId Consumer ID
 * @param  {Function} cb         Callback
 * @returns {void}
 */
function applyProviderConsumerLimit(providerId, consumerId, cb) {
  if (!providerId || !consumerId) {
    cb();
  }

  var provider = providersLimiters[providerId];
  if (!provider || !provider.consumers) {
    cb();
  }

  var limiter = provider.consumers[consumerId];
  if (!limiter) {
    cb();
  }

  limiter.removeTokens(1, function(err, remainingRequests) {
    if (err || remainingRequests === -1) {
      // Throw error rate limit exceeded
      cb(new RateLimitExceeded(RateLimitExceeded.PROVIDER_CONSUMER_LIMIT_EXCEEDED));
    }
    cb();
  }, true);
}


/**
 * Simple rate limit implementation.
 * Limits can be applied globally, on a concrete provider, on a concrete
 * consumer or on a concrete provider's consumer.
 *
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

  //
  // TODO - Check global, consumers and providers are well formed.
  //
  // Check for configuration parameters
  var hasConsumers = config.consumers && Object.keys(config.consumers).length > 0;
  var hasProviders = config.providers && Object.keys(config.providers).length > 0;
  if (!config || (!config.global && !hasConsumers && !hasProviders) ) {
    throw new Error("'simple-rate-limit': Invalid filter parameters !!! At least one global, consumer or provider must be specified.");
  }

  // Initialize limiters
  initializeLimiters(config);

  // Return middleware function that applies rates limits
  return function(req, res, next) {

    //
    // Limits are applied in the order:
    //
    //  global -> consumer -> provider -> provier-consumer
    //
    // TODO - Improve using promises
    //
    applyGlobalLimit(function(errGlobal) {
      if (errGlobal) {
        next(errGlobal);
      }

      applyConsumerLimit(function(errConsumer) {
        if (errConsumer) {
          next(errConsumer);
        }

        applyProviderLimit(function(errProvider) {
          if (errProvider) {
            next(errProvider);
          }

          applyProviderConsumerLimit(function(err) {
            if (err) {
              next(err);
            }

            next();
          });
        });
      });
    });

  };

};
