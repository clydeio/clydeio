#!/usr/bin/env node

"use strict";

var http = require("http"),
    options = require("./lib/options"),
    clyde = require("./lib/clyde");

// Create Clyde middleware
var middleware = clyde.createMiddleware(options);

// Create server and listen on port
var server = http.createServer(middleware);
server.listen(options.port);

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

server.on("listening", function() {
  var addr = server.address();
  console.info("Clyde is listening on port " + addr.port);
});
