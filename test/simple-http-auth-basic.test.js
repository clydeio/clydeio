"use strict";

var config = require("./fixtures/config-http-auth-basic.json");
var http = require("http");
var clyde = require("../lib/clyde");
var request = require("supertest");


describe("simple-http-auth basic method", function() {

  var server;

  before(function(done) {

    config.loglevel = "info";
    config.logfile = "clyde.log";

    // Start clyde server with test configuration
    var clydeProxy = clyde.createProxyServer(config);
    server = http.createServer(clydeProxy);
    server.listen(8888);
    server.on("listening", function() {
      done();
    });
  });

  after(function(done) {
    // Stop clyde server
    server.close();
    done();
  });


  it("should fail due invalid authentication", function(done) {
    request("http://127.0.0.1:8888")
      .get("/foo")
      .auth("bad-username", "bad-password")
      .expect(401, done);
  });

  it("should succes user authentication", function(done) {
    // Note we expect a 404, which means we have authenticated successfully but
    // no provider was found.
    request("http://127.0.0.1:8888")
      .get("/foo")
      .auth("userA", "passwordA")
      .expect(404, done);
  });

});
