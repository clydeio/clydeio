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
 * Creates the limiters corresponding to the specified configuration. The new
 * object has the same properties with limiters as values.
 *
 * @private
 * @param  {Object} config Configuration
 * @returns {Object} Limiters parsed from configuration.
 */
function parseLimiters(config) {

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
        if ({}.hasOwnProperty.call(cfg.consumers, prop)) {
          limitConfig = cfg.consumers[prop];
          limiters[prop] = new RateLimiter(limitConfig.tokens, limitConfig.interval);
        }
      }
    }
    return limiters;
  }

  function parseProviders(cfg) {
    var prop, limitConfig, limiters = {};
    if (cfg.providers) {
      for (prop in cfg.providers) {
        if ({}.hasOwnProperty.call(cfg.providers, prop)) {
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
    }
    return limiters;
  }

  // Parse configuration
  return {
    global: parseGlobal(config),
    consumers: parseConsumers(config),
    providers: parseProviders(config)
  };
}


/**
 * Apply global rate limits.
 *
 * @private
 * @param {Object} globalLimiter Limiter
 * @param  {Function} cb Callback.
 * @returns {void}
 */
function applyGlobalLimit(globalLimiter, cb) {
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
 * @param {Object} consumersLimiters Consumers configuration
 * @param  {String}   consumerId Consumer ID
 * @param  {Function} cb       Callback
 * @returns {void}
 */
function applyConsumerLimit(consumersLimiters, consumerId, cb) {
  if (!consumersLimiters || !consumerId) {
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
 * @private
 * @param {Object} providersLimiters Providers limiters
 * @param  {String}   providerId Provider ID
 * @param  {Function} cb       Callback
 * @returns {void}
 */
function applyProviderLimit(providersLimiters, providerId, cb) {
  if (!providersLimiters || !providerId) {
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
 * @private
 * @param {Object} providersLimiters Providers limiters
 * @param  {String}   providerId Provider ID
 * @param  {String}   consumerId Consumer ID
 * @param  {Function} cb         Callback
 * @returns {void}
 */
function applyProviderConsumerLimit(providersLimiters, providerId, consumerId, cb) {
  if (!providersLimiters || !providerId || !consumerId) {
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
  // TODO - Check global, consumers and providers are well formedand has token-interval.
  //
  // Check for configuration parameters
  var hasConsumers = config.consumers && Object.keys(config.consumers).length > 0;
  var hasProviders = config.providers && Object.keys(config.providers).length > 0;
  if (!config || (!config.global && !hasConsumers && !hasProviders) ) {
    throw new Error("'simple-rate-limit': Invalid filter parameters !!! At least one global, consumer or provider must be specified.");
  }

  // Initialize limiters
  var limiters = parseLimiters(config);

  // Return middleware function that applies rates limits
  return function(req, res, next) {

    var consumerId,
        providerId = req.provider;
    if (req.user || req.user.userId) {
      consumerId = req.user.userId;
    }

    //
    // Apply rate limits.
    // The chain of limitations follow the order: global, consumer, provider
    // and provider-consumer.
    //
    // TODO - Improve using promises
    //
    applyGlobalLimit(limiters.global, function(errGlobal) {
      if (errGlobal) {
        next(errGlobal);
      }

      applyConsumerLimit(limiters.consumers, consumerId, function(errConsumer) {
        if (errConsumer) {
          next(errConsumer);
        }

        applyProviderLimit(limiters.providers, providerId, function(errProvider) {
          if (errProvider) {
            next(errProvider);
          }

          applyProviderConsumerLimit(limiters.providers, providerId, consumerId, function(err) {
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
