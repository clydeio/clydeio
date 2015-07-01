"use strict";

var path = require("path");

/**
 * Parse command line arguments, load configuration file and merge configuration
 * options.
 *
 * Note: Command line arguments overrides configuration file options.
 */

var argv = require("yargs")
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

// Load configuration file
var options = require(path.join(process.cwd(), argv._[0]));

// Override options with command line specified. Command line takes precedence.
options.logfile = argv.logfile || options.logfile || "clyde.log";
options.loglevel = argv.loglevel || options.loglevel || "info";
options.port = argv.port || options.port || "8000";

module.exports = options;
