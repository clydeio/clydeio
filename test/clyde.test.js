/* eslint no-unused-vars:0 */
"use strict";

var path = require("path"),
    expect = require("chai").expect,
    http = require("http"),
    clyde = require("../lib/clyde");


describe("clyde", function() {

  var server;

  afterEach(function() {
    server.close();
  });

  it("should fail because invalid configuration object", function() {
    
    var options = {};

    var middleware = clyde.createMiddleware(options);
    server = http.createServer(middleware);
    server.listen(options.port);

  });

});