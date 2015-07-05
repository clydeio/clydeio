"use strict";

var request = require("supertest"),
    nock = require("nock"),
    http = require("http"),
    clyde = require("../lib/clyde"),
    NoProviderFound = require("../lib/errors/no-provider-found.js");


describe("clyde", function() {

  var server;

  afterEach(function() {
    server.close();
  });

  it("should fail due provider not found error", function(done) {
    var options = {
      port: 8888,
      logfile: "clyde.log",
      loglevel: "info",
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port"
        }
      ]
    };

    // Create server with clyde's middleware options
    var middleware = clyde.createMiddleware(options);
    server = http.createServer(middleware);
    server.listen(options.port);

    // Expected error
    var expectedError = new NoProviderFound();

    // Make request and expect a no provider found error
    request("http://localhost:8888")
      .get("/foo")
      .expect(404, expectedError.message, done);
  });

  it("should success requesting a provider", function(done) {
    var options = {
      port: 8888,
      logfile: "clyde.log",
      loglevel: "info",
      providers: [
        {
          id: "id",
          context: "/providerA",
          target: "http://serverA"
        }
      ]
    };

    // Create server with clyde's middleware options
    var middleware = clyde.createMiddleware(options);
    server = http.createServer(middleware);
    server.listen(options.port);

    // Mock provider's request
    nock("http://serverA")
      .get("/")
      .reply(200, { msg: "hi" });

    // Make request
    request("http://localhost:8888")
      .get("/providerA")
      .expect(200, {msg: "hi"}, done);
  });


});