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
 * @param  {[type]}
 * @return {[type]}
 */
function base(path) {
  basePath = path;
}

/**
 * Loads the modules associated to each filter and returns an array of middlewares.
 * 
 * @param  {Array} filters Array with filters configuration
 * @return {Array<function>} Array of middleware functions
 */
function loadMiddlewareFilters(filters) {

  var result = [],
      index, 
      num = filters.length, 
      filter, 
      modulePath, 
      middleware;

  for(index=0; index < num; index++) {
    filter = filters[index];

    // Check filter has required properties
    if(!filter.name || !filter.path) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_FILTER_MESSAGE, " At position " + index);
    }

    // Load filter module and initialize middleware filter
    modulePath = path.join(basePath, filter.path);
    middleware = require(modulePath).init(filter.name, filter.config);

    result.push(middleware);
  }

  return result;
}

function loadMiddlewareProviders(providers) {

  var result = [],
      index, 
      num = providers.length, 
      provider, 
      filters;

  for(index=0; index < num; index++) {
    provider = providers[index];
    filters = [];

    // Check provider has required properties
    if(!provider.context || !provider.name || !provider.target) {
      throw new InvalidConfiguration(InvalidConfiguration.INVALID_PROVIDER_MESSAGE, " At position " + index);
    }

    // Load provider's filters
    if(provider.filters) {
      filters = loadMiddlewareFilters(provider.filters);
    }

    // Store provider information
    result.push({
      context: provider.context,
      name: provider.name,
      target: provider.target,
      filters: filters
    });
  }

  return result;
}

/**
 * Loads specified configuration returning a configuration instance with 
 * prefilters, postfilters and providers.
 * 
 * @param  {object} config 
 * @return {Configuration} Configuration instance
 */
function load(config) {

  var configuration = {
    prefilters: [],
    postfilters: [],
    providers: []
  };

  // Check a valid object
  if(typeof config !== "object") {
    throw new InvalidConfiguration(InvalidConfiguration.EMPTY_MESSAGE);
  }

  // Check at least one provider
  if(!config.providers || !config.providers.length) {
    throw new InvalidConfiguration(InvalidConfiguration.NO_PROVIDER_MESSAGE);
  }

  // Load prefilters
  if(config.prefilters) {
    configuration.prefilters = loadMiddlewareFilters(config.prefilters);
  }

  // Load postfilters
  if(config.postfilters) {
    configuration.postfilters = loadMiddlewareFilters(config.postfilters);
  }

  // Load providers
  configuration.providers = loadMiddlewareProviders(config.providers);

  return configuration;

};


module.exports.base = base;
module.exports.load = load;
