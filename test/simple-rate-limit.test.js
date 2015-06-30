/* eslint no-unused-expressions:0 */
"use strict";

var path = require("path");
var expect = require("chai").expect;
var configuration = require("../lib/configuration");


describe("simple-rate-limit", function() {

  before(function() {
    configuration.base(path.join(__dirname, ".."));
  });


  it("should fail due global limit exceed", function() {
    var configJS = require("./fixtures/config-rate-limit-global.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    // Configuration allows 1 call per second, so first call must be fine and
    // the second must fail.
    rateLimit.middleware({}, {}, function(err) {
      expect(err).to.be.undefined;
    });

    rateLimit.middleware({}, {}, function(err) {
      expect(err.name).to.be.equal("RateLimitExceeded");
    });

  });


  it("should fail due consumer limit exceed", function() {
    var configJS = require("./fixtures/config-rate-limit-consumer.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    // Configuration allows 1 call per second, so first call must be fine and
    // the second must fail.
    rateLimit.middleware({user: {userId: "userA"}}, {}, function(err) {
      expect(err).to.be.undefined;
    });

    rateLimit.middleware({user: {userId: "userA"}}, {}, function(err) {
      expect(err.name).to.be.equal("RateLimitExceeded");
    });
  });


  it("should fail due provider global limit exceed", function() {
    var configJS = require("./fixtures/config-rate-limit-provider-global.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    // Configuration allows 1 call per second, so first call must be fine and
    // the second must fail.
    rateLimit.middleware({provider: { context: "/providerA" }}, {}, function(err) {
      expect(err).to.be.undefined;
    });

    rateLimit.middleware({provider: { context: "/providerA" }}, {}, function(err) {
      expect(err.name).to.be.equal("RateLimitExceeded");
    });
  });


  it("should fail due provider-consumer limit exceed", function() {
    var configJS = require("./fixtures/config-rate-limit-provider-consumer.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    // Configuration allows 1 call per second, so first call must be fine and
    // the second must fail.
    rateLimit.middleware({provider: { context: "/providerA" }, user: {userId: "userA"}}, {}, function(err) {
      expect(err).to.be.undefined;
    });

    rateLimit.middleware({provider: { context: "/providerA" }, user: {userId: "userA"}}, {}, function(err) {
      expect(err.name).to.be.equal("RateLimitExceeded");
    });
  });

});
