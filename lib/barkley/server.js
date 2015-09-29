"use strict";


var http = require("http"),
    express = require("express"),
    logger = require("morgan"),
    bodyParser = require("body-parser"),
    routes = require("./routes");


function startServer(opts) {

  // TODO - This must be integrated with bin/clyde script and read options from command line

  // Check options
  opts = opts || {};
  opts.port = opts.port || 9999;
  opts.format = opts.format || "dev";

  // Load barkley implementation
  var barkley = opts.repository ? opts.repository : require("./memory-repository");

  // Create express application
  var app = express();

  // Add logger in non test environment
  if ( app.get("env") !== "test" ) {
    // TODO - Configure barkley to store logs on file (with rotation)
    app.use(logger(opts.format));
  }
  app.use(bodyParser.json());

  // Routes handlers
  app.use("/", routes(barkley));

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
  });

  // error handler
  app.use(function(err, req, res, next) {   // eslint-disable-line no-unused-vars
    var status = err.status || 500;
    var message = err.message || err; // Some errors are directly the message string.
    res.status(status).json({
      status: status,
      message: message
    });
  });

  // Create HTTP server.
  var server = http.createServer(app);
  server.listen(opts.port);
  server.on("error", function(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error("Barkley, " + opts.port + " requires elevated privileges");
        process.exit(1);  // eslint-disable-line no-process-exit
        break;
      case "EADDRINUSE":
        console.error("Barkley, " + opts.port + " is already in use");
        process.exit(1);  // eslint-disable-line no-process-exit
        break;
      default:
        throw error;
    }
  });
  server.on("listening", function onListening() {
    var addr = server.address();
    console.log("Barkley, listening on " + addr.port);
  });

  return server;
}


module.exports = {
  startServer: startServer
};
