"use strict";

/**
 * Creates a bunyan based log instance to log clyde messages.
 */

var bunyan = require("bunyan");
var mkdirp = require("mkdirp");
var path = require("path");


module.exports = function(options) {

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
    type: "rotating-file",
    path: options.logfile,
    level: options.loglevel,
    period: "1d"   // daily rotation
  };

  streams.push(rotateFileStream);

  return bunyan.createLogger({
    name: "clyde",
    level: options.loglevel,
    streams: streams,
    serializers: bunyan.stdSerializers
  });

};
