"use strict";

var util = require("util");

function InvalidConfiguration(message) {
  Error.captureStackTrace(this, this.constructor);
  this.statusCode = 404;
  this.name = this.constructor.name;
  this.message = message ? message : InvalidConfiguration.NO_PROVIDER_MESSAGE;
}

InvalidConfiguration.EMPTY_MESSAGE = "Invalid configuration. No valid configuration were found.";
InvalidConfiguration.NO_PROVIDER_MESSAGE = "Invalid configuration. At least one provider is required.";
InvalidConfiguration.INVALID_FILTER_MESSAGE = "Invalid filter configuration.";
InvalidConfiguration.INVALID_PROVIDER_MESSAGE = "Invalid provider configuration.";
InvalidConfiguration.INVALID_RESOURCE_MESSAGE = "Invalid resources configuration.";

util.inherits(InvalidConfiguration, Error);

module.exports = InvalidConfiguration;
