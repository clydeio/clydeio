"use strict";

var FileStreamRotator = require("file-stream-rotator");
var mkdirp = require("mkdirp");
var path = require("path");
var morgan = require("morgan");


/**
 * Simple access log implementation based on morgan.
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filterconfiguration
 * @return {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  if(!config || !config.directory || !config.file) {
    throw new Error("'simple-access-logger': Invalid filter parameters !!! Directory and file name are required. ");  
  }

  // Ensure log directory exists
  mkdirp.sync(config.directory);

  // create a rotating write stream
  var accessLogStream = FileStreamRotator.getStream({
    filename: path.join(config.directory, config.file),
    frequency: 'daily',
    verbose: false,
    date_format: "YYYY-MM-DD"
  });

  return morgan('combined', {stream: accessLogStream});
};
