"use strict";

var bunyan = require("bunyan");
var mkdirp = require("mkdirp");
var path = require("path");

/**
 * Creates a bunyan log bases instance to log clyde messages.
 * 
 * @param  {object} options Options to create the bunyan logger.
 * @return {object} A bunyan based logger.
 */
module.exports.log = function(options) {

  // Create log folders path if needed.
  var dir = path.dirname(options.logfile);
  mkdirp.sync(dir);

  var streams = [
    // Default console streams
    {
      level: options.loglevel,
      stream: process.stdout
    }
  ];

  // TODO - Add rotate options to command line arguments
  var rotateFileStream = {
    type: 'rotating-file',
    path: options.logfile,
    period: '1d'   // daily rotation
  };

  streams.push(rotateFileStream);

  var log = bunyan.createLogger({
    name: "clyde",
    level: options.loglevel,
    streams: streams,
    serializers: bunyan.stdSerializers
  });

  return log;
};
