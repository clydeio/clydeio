"use strict";

/**
 * Helper class to easily create errors with HTTP codes and custom messages
 */

var util = require("util");

function HttpError(status, message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = status;
  this.message = message || "HTTP error";
}

util.inherits(HttpError, Error);

module.exports = HttpError;
