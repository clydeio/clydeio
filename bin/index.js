#!/usr/bin/env node

/*eslint no-use-before-define:0, no-process-exit:0*/

"use strict";

var http = require("http"),
    config = require("../config.json"),
    clyde = require("../lib/clyde.js");


/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || "3000");


/**
 * Create proxy HTTP server.
 */
var clydeProxy = clyde.createProxyServer(config);
var server = http.createServer(clydeProxy);


/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);


/**
 * Normalize a port into a number, string, or false.
 * @param {Number} val Port number to use
 * @returns {Number} Normalized value or false otherwise
 */
function normalizePort(val) {
  var portNumber = parseInt(val, 10);

  if (isNaN(portNumber)) {
    // named pipe
    return val;
  }

  if (portNumber >= 0) {
    // port number
    return portNumber;
  }

  return false;
}


/**
 * Event listener for HTTP server "error" event.
 * @param {number} error Error number
 * @returns {void}
 * @throws {Error}
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}


/**
 * Event listener for HTTP server "listening" event.
 * @returns {void}
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  console.log("Clyde is listening on " + bind);
}



////////////////////////////////////////////////////////////////////////
// TODO - Remove this, only for bad testing. Move this to tests.
var prov1 = http
  .createServer(function(req, res) {
    console.log("provider 1 called on port 4000");
    res.write("PROVIDER 1");
    res.end();
  })
  .listen(4000);


