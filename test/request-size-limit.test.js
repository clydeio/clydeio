"use strict";

var expect = require("chai").expect;
var config = require("./fixtures/config-request-size-limit.json");
var http = require("http");
var clyde = require("../lib/clyde");
var request = require("supertest");

describe("request-size-limit", function() {

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


  it("should fail due invalid request size limit", function(done) {
    // NOTE: We expect an error 404 (provider not found) which means the filters
    // has passed.

    request("http://127.0.0.1:8888")
      .post("/foo")
      .send("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.")
      .expect(413, done);
  });


  it("should fail due invalid content length", function(done) {
    // NOTE: We expect an error 404 (provider not found) which means the filters
    // has passed.

    request("http://127.0.0.1:8888")
      .get("/foo")
      .send("Invalid content length")
      .expect(400, done);
  });


  it("should success", function(done) {
    // NOTE: We expect an error 404 (provider not found) which means the filters
    // has passed.

    request("http://127.0.0.1:8888")
      .get("/foo")
      .send("12345")
      .expect(404, done);
  });

});
