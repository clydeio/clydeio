"use strict";

var RateLimiter = require("limiter").RateLimiter;
var util = require("util");


/**
 * InvalidRateLimitConfiguration error triggered when passed invalid configurations.
 *
 * @param {String} description Extended description
 * @returns {void}
 */
function InvalidRateLimitConfiguration(description) {
  Error.captureStackTrace(this, this.constructor);
  this.status = 421;
  this.name = this.constructor.name;
  this.message = "Invalid rate limit configuration !!!";
  if (description) {
    this.message += " " + description;
  }
}
util.inherits(InvalidRateLimitConfiguration, Error);


/**
 * RateLimitExceeded error triggered with a rate limit is exceeded.
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
 * Validate the configuration parameters.
 *
 * @param  {Object} config Configuration
 * @returns {void}
 */
function validateConfig(config) {

  function isValidGlobal(globalCfg) {
    if (globalCfg && (!globalCfg.tokens || !globalCfg.interval)) {
      return false;
    }
    return true;
  }

  function isValidConsumers(consumersCfg) {
    var prop, limitConfig;
    if (consumersCfg) {
      for (prop in consumersCfg) {
        if ({}.hasOwnProperty.call(consumersCfg, prop)) {
          limitConfig = consumersCfg[prop];
          if (limitConfig && (!limitConfig.tokens || !limitConfig.interval)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function isValidProviders(providersCfg) {
    var prop, limitConfig;
    if (providersCfg) {
      for (prop in providersCfg) {
        if ({}.hasOwnProperty.call(providersCfg, prop)) {
          limitConfig = providersCfg[prop];

          if (limitConfig.global && !isValidGlobal(limitConfig.global)) {
            return false;
          }

          if (limitConfig.consumers && !isValidConsumers(limitConfig.consumers)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  if (!config.global && !config.consumers && !config.providers) {
    throw new InvalidRateLimitConfiguration("At least one global, consumers or providers entry is required.");
  }

  if (!isValidGlobal(config.global)) {
    throw new InvalidRateLimitConfiguration("Invalid global section.");
  }

  if (!isValidConsumers(config.consumers)) {
    throw new InvalidRateLimitConfiguration("Invalid consumers section.");
  }

  if (!isValidProviders(config.providers)) {
    throw new InvalidRateLimitConfiguration("Invalid providers section.");
  }
}

/**
 * Creates the limiters corresponding to the specified configuration. The new
 * object has the same properties with limiters as values.
 *
 * @private
 * @param  {Object} config Configuration
 * @returns {Object} Limiters parsed from configuration.
 */
function parseLimiters(config) {

  function parseGlobal(globalCfg) {
    var limiter;
    if (globalCfg.global) {
      limiter = new RateLimiter(globalCfg.global.tokens, globalCfg.global.interval);
    }
    return limiter;
  }

  function parseConsumers(consumersCfg) {
    var prop, limitConfig, limiters = {};
    if (consumersCfg) {
      for (prop in consumersCfg) {
        if ({}.hasOwnProperty.call(consumersCfg, prop)) {
          limitConfig = consumersCfg[prop];
          limiters[prop] = new RateLimiter(limitConfig.tokens, limitConfig.interval);
        }
      }
    }
    return limiters;
  }

  function parseProviders(providersCfg) {
    var prop, limitConfig, limiters = {};
    if (providersCfg) {
      for (prop in providersCfg) {
        if ({}.hasOwnProperty.call(providersCfg, prop)) {
          limitConfig = providersCfg[prop];
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
    consumers: parseConsumers(config.consumers),
    providers: parseProviders(config.providers)
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
    return cb();
  }

  if (!globalLimiter.tryRemoveTokens(1)) {
    return cb(new RateLimitExceeded(RateLimitExceeded.GLOBAL_LIMIT_EXCEEDED));
  }

  return cb();
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
  if (!Object.keys(consumersLimiters).length || !consumerId) {
    return cb();
  }

  var limiter = consumersLimiters[consumerId];
  if (!limiter) {
    return cb();
  }

  if (!limiter.tryRemoveTokens(1)) {
    return cb(new RateLimitExceeded(RateLimitExceeded.CONSUMER_LIMIT_EXCEEDED));
  }

  return cb();
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
  if (!Object.keys(providersLimiters).length || !providerId) {
    return cb();
  }

  var provider = providersLimiters[providerId];
  if (!provider || !provider.global) {
    return cb();
  }

  if (!provider.global.tryRemoveTokens(1)) {
    return cb(new RateLimitExceeded(RateLimitExceeded.PROVIDER_LIMIT_EXCEEDED));
  }

  return cb();
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
  if (!Object.keys(providersLimiters).length || !providerId || !consumerId) {
    return cb();
  }

  var provider = providersLimiters[providerId];
  if (!provider || !provider.consumers) {
    return cb();
  }

  var limiter = provider.consumers[consumerId];
  if (!limiter) {
    return cb();
  }

  if (!limiter.tryRemoveTokens(1)) {
    return cb(new RateLimitExceeded(RateLimitExceeded.PROVIDER_CONSUMER_LIMIT_EXCEEDED));
  }

  return cb();
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

  // Validate configuration
  validateConfig(config);

  // Initialize limiters
  var limiters = parseLimiters(config);

  // Return middleware function that applies rates limits
  return function(req, res, next) {

    var consumerId,
        providerId = req.provider;
    if (req.user && req.user.userId) {
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
        return next(errGlobal);
      }

      applyConsumerLimit(limiters.consumers, consumerId, function(errConsumer) {
        if (errConsumer) {
          return next(errConsumer);
        }

        applyProviderLimit(limiters.providers, providerId, function(errProvider) {
          if (errProvider) {
            return next(errProvider);
          }

          applyProviderConsumerLimit(limiters.providers, providerId, consumerId, function(err) {
            if (err) {
              return next(err);
            }

            return next();
          });
        });
      });
    });

  };

};
