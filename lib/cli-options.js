

/**
 * Parse command line arguments
 */
var argv = require("yargs")
  .usage("Usage: $0 [options]")
  .example("$0 --log info", "Start clyde with log messages on 'info' level")
  .describe("logfile", "Path to the log file. Default 'clyde.log'.")
  .nargs('logfile', 1)
  .describe("loglevel", "Level used for clyde log messages. Default 'info'.")
  .nargs('loglevel', 1)
  .describe("port", "Port where clyde will listen. Default 8080.")
  .nargs('port', 1)
  .help("help")
  .showHelpOnFail(false, "Specify --help for available options")
  .argv;


/**
 * Set options
 */
var options = {
  logfile: argv.logfile || "clyde.log",
  loglevel: argv.loglevel || "info",
  port: argv.port || "8080"
};


module.exports = options;
