#!/usr/bin/env node

"use strict";

/**
 * Normalize a port into a number, string, or false.
 * @param {Number} val Port number to use
 * @returns {Number} Normalized value or false otherwise
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port

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
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  console.log("Clyde is listening on " + bind);
}


/**
 * Module dependencies.
 */
var http = require("http");
var config = require("../config.json");
var clyde = require("../lib/clyde.js");


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
