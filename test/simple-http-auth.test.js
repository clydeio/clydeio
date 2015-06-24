/* eslint no-unused-vars:0, no-unused-expressions:0 */
"use strict";

var path = require("path");
var expect = require("chai").expect;
var config = require("./fixtures/config-http-auth-basic.json");
var http = require("http");
var clyde = require("../lib/clyde");
var request = require("supertest");


describe("simple-http-auth", function() {

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
    var body = "request body";
    var httpRequest = {
      host: "localhost",
      port: 8888,
      path: "/foo",
      method: "GET",
      headers: {
        "x-auth-signedheaders": "host; content-type; date",
        "Content-Type": "text/plain",
        "Date": new Date().toUTCString()
      }
    };

    // Sign request with invalid secret
    hmmac.sign(httpRequest, {key: "keyA", secret: "secret"});

    // Make request
    var req = http.request(httpRequest, function(res) {
      expect(res.statusCode).to.be.equal(401);
      done();
    });

    req.end(body);
  });

});
