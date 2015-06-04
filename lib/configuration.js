"use strict";

var path = require("path");
var InvalidConfiguration = require("./errors/invalid-configuration");


/**
 * Base path where to load filters from.
 *
 * @type {String}
 */
var basePath = "";

/**
 * Sets the base path where to load filters from.
 *
 * @public
 * @param  {string} loadpath Path to be used for searching modules
 * @returns {void}
 */
function base(loadpath) {
  basePath = loadpath;
}

/**
 * Loads the modules associated to each filter and returns an array of middlewares.
 *
 * @private
 * @param  {Array} filters Array with filters configuration
 * @returns {Array<object>} Array with filter's configuration plus a middleware
 * object referencing the loaded filter's module.
 */
function loadMiddlewareFilters(filters) {

  var result = [],
      index,
      num = filters.length,
      filter,
      modulePath,
      middleware;

  for (index = 0; index < num; index++ ) {
    filter = filters[index];

    // Check filter has required properties
    if (!filter.name || !filter.path) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_FILTER_MESSAGE, " At position " + index);
    }

    // Load filter module and initialize middleware filter
    modulePath = path.join(basePath, filter.path);
    middleware = require(modulePath).init(filter.name, filter.config);

    result.push({
      name: filter.name,
      path: modulePath,
      config: filter.config,
      middleware: middleware
    });
  }

  return result;
}


/**
 * Load providers configuration loading its pre and postfilters modules.
 *
 * @private
 * @param  {Array<object>} providers Array with providers configuration.
 * @returns {Array<object>} Array with provider's configuration plus a middleware
 * object referencing the filter's module.
 */
function loadProviders(providers) {

  var result = [],
      index,
      num = providers.length,
      provider,
      prefilters, postfilters;

  for (index = 0; index < num; index++ ) {
    provider = providers[index];
    prefilters = [];
    postfilters = [];

    // Check provider has required properties
    if (!provider.context || !provider.name || !provider.target) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_PROVIDER_MESSAGE, " At position " + index);
    }

    // Load provider's filters
    if (provider.prefilters) {
      prefilters = loadMiddlewareFilters(provider.prefilters);
    }
    if (provider.postfilters) {
      postfilters = loadMiddlewareFilters(provider.postfilters);
    }

    // Store provider information
    result.push({
      context: provider.context,
      name: provider.name,
      target: provider.target,
      prefilters: prefilters,
      postfilters: postfilters
    });
  }

  return result;
}


/**
 * Loads a configuration returning prefilters, postfilters and providers
 * middlewares loaded to be used.
 *
 * @public
 * @param  {object} config JavaScript object with configuration
 * @returns {object} configuration with middlewares loaded.
 */
function load(config) {

  var configuration = {
    prefilters: [],
    providers: [],
    postfilters: []
  };

  // Check a valid object
  if (typeof config !== "object") {
    throw new InvalidConfiguration(InvalidConfiguration.EMPTY_MESSAGE);
  }

  // Check at least one provider
  if (!config.providers || !config.providers.length) {
    throw new InvalidConfiguration(InvalidConfiguration.NO_PROVIDER_MESSAGE);
  }

  // Load prefilters
  if (config.prefilters) {
    configuration.prefilters = loadMiddlewareFilters(config.prefilters);
  }

  // Load postfilters
  if (config.postfilters) {
    configuration.postfilters = loadMiddlewareFilters(config.postfilters);
  }

  // Load providers
  configuration.providers = loadProviders(config.providers);

  return configuration;
}


module.exports.base = base;
module.exports.load = load;
