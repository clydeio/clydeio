#!/usr/bin/env node

"use strict";

var path = require("path"),
    yargs = require("yargs"),
    http = require("http"),
    clyde = require("../lib/clyde");


/**
 * Merge command line options with configuration file
 *
 * @returns {Object} Configuration object
 */
function getOptions() {

  //
  // Defines and parses the command line interface to start Clyde server.
  //
  var argv = yargs
    .usage("Usage: $0 [options] config_file")
    .example("$0 config.json", "Start clyde reading configuration from 'config.json' file.")
    .example("$0 --log debug config.json", "Start clyde with log messages on 'debug' level and reading configuration from 'config.json' file.")
    .describe("logfile", "Path to the log file. Default 'clyde.log'.")
    .nargs("logfile", 1)
    .describe("loglevel", "Level used for clyde log messages. Default 'info'.")
    .nargs("loglevel", 1)
    .describe("port", "Port where clyde will listen. Default 8080.")
    .nargs("port", 1)
    .help("help")
    .demand(1, "A configuration file must be specified")
    .showHelpOnFail(false, "Specify --help for available options")
    .argv;

  //
  // Load configuration file
  //
  var options = require(path.join(process.cwd(), argv._[0]));

  //
  // Override options with command line specified. Command line takes precedence.
  //
  options.logfile = argv.logfile || options.logfile || "clyde.log";
  options.loglevel = argv.loglevel || options.loglevel || "info";
  options.port = argv.port || options.port || 8000;

  return options;
}

// Get options
var options = getOptions();

// Create Clyde middleware
var middleware = clyde.createMiddleware(options);

// Create server and listen on port
var server = http.createServer(middleware);
server.listen(options.port);

// Handle listening event
server.on("listening", function() {
  var addr = server.address();
  console.info("Clyde is listening on port " + addr.port);
});

// Handle error event
server.on("error", function(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error("Port " + options.port + " requires elevated privileges");
      process.exit(1);  // eslint-disable-line no-process-exit
      break;
    case "EADDRINUSE":
      console.error("Port " + options.port + " is already in use");
      process.exit(1);  // eslint-disable-line no-process-exit
      break;
    default:
      throw error;
  }
});
