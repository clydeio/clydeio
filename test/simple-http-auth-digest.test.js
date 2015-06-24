"use strict";

var expect = require("chai").expect;
var config = require("./fixtures/config-http-auth-digest.json");
var http = require("http");
var clyde = require("../lib/clyde");
var request = require("request");


describe("simple-http-auth digest method", function() {

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
    request.get("http://127.0.0.1:8888/", {
      "auth": {
        "user": "bad-username",
        "pass": "bad-password",
        "sendImmediately": false
      }
    }, function (error, response) {
      if (error) {
        throw error;
      }

      expect(response.statusCode).to.be.equal(401);
      done();
    });
  });


  it("should success user authentication", function(done) {
    // Note we expect a 404, which means we have authenticated successfully but
    // no provider was found.
    request.get("http://127.0.0.1:8888/", {
      "auth": {
        "user": "userA",
        "pass": "passwordA",
        "sendImmediately": false
      }
    }, function (error, response) {
      if (error) {
        throw error;
      }

      expect(response.statusCode).to.be.equal(404);
      done();
    });
  });

});
