"use strict";

var FileStreamRotator = require("file-stream-rotator");
var mkdirp = require("mkdirp");
var path = require("path");
var morgan = require("morgan");


/**
 * Simple access log implementation based on morgan. Allowed configuration
 * properties:
 *
 * @example
 * {
 *   "directory" : "./tmp/log",
 *   "file" : "access-%DATE%.log"
 * }
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filter configuration
 * @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  if (!config || !config.directory || !config.file) {
    throw new Error("'simple-access-logger': Invalid filter parameters !!! Directory and file name are required.");
  }

  // Ensure log directory exists
  mkdirp.sync(config.directory);

  // Create a rotating write stream
  // TODO - Add frequency and date_format parameters to configuration.
  var accessLogStream = FileStreamRotator.getStream({
    filename: path.join(config.directory, config.file),
    frequency: "daily",
    verbose: false,
    date_format: "YYYY-MM-DD" // eslint-disable-line camelcase
  });

  return morgan("combined", {stream: accessLogStream});
};
