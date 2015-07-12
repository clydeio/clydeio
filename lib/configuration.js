"use strict";

var path = require("path");
var InvalidConfiguration = require("./errors/invalid-configuration");


/**
 * Base path where to load filters from is always $CLYDE/filters directory.
 *
 * @type {String}
 */
var basePath = path.join(__dirname, "..", "filters");

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

  function startsWith(string, searchString, position) {
    position = position || 0;
    return string.indexOf(searchString, position) === position;
  }

  for (index = 0; index < num; index++ ) {
    filter = filters[index];

    // Check filter has required properties
    if (!filter.id) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_FILTER_MESSAGE, " Filter at index " + index + " has no 'id' property.");
    }
    if (!filter.path) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_FILTER_MESSAGE, " Filter at index " + index + " has no 'path' property.");
    }

    // Determine module path depending on if it must be loaded from 'filters' folder
    // or node modules.
    modulePath = filter.path;
    if (startsWith(filter.path, ".")) {
      modulePath = path.join(basePath, filter.path);
    }

    // Load filter module and initialize middleware filter
    middleware = require(modulePath).init(filter.id, filter.config);

    result.push({
      id: filter.id,
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
    if (!provider.id) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_PROVIDER_MESSAGE, " Provider at index " + index + " has no 'id' property.");
    }
    if (!provider.target) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_PROVIDER_MESSAGE, " Provider at index " + index + " has no 'target' property.");
    }
    if (!provider.context) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_PROVIDER_MESSAGE, " Provider at index " + index + " has no context' property.");
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
      id: provider.id,
      context: provider.context,
      target: provider.target,
      prefilters: prefilters,
      postfilters: postfilters
    });
  }

  return result;
}


/**
 * Load a configuration returning and object with prefilters, postfilters and
 * providers middlewares ready to be used.
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


module.exports.load = load;
