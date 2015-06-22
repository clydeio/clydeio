"use strict";

var util = require("util");

function NoProviderFound(message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.statusCode = 404;
  this.name = this.constructor.name;
  this.message = message ? message : "No provider found for the request !!!";
  this.extra = extra;
}

util.inherits(NoProviderFound, Error);

module.exports = NoProviderFound;
