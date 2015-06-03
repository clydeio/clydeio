"use strict";

var FileStreamRotator = require("file-stream-rotator");
var mkdirp = require("mkdirp");
var path = require("path");
var morgan = require("morgan");


/**
 * Log implementation based on morgan. See: https://github.com/expressjs/morgan#log-file-rotation
 */
module.exports.init = function(name, config) {

  // TODO - Check for valid configuration !!!.

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
