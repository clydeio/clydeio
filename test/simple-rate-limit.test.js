/* eslint no-unused-vars:0 */
"use strict";

var path = require("path");
var expect = require("chai").expect;
var configuration = require("../lib/configuration");
var InvalidConfiguration = require("../lib/errors/invalid-configuration");


describe("simple-rate-limit", function() {

  before(function() {
    configuration.base(path.join(__dirname, ".."));
  });

  it("should fail due global limit exceed", function(done) {
    var configJS = require("./fixtures/config-rate-limit-global.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    // Configuration allows 1 call per second, so first call must be fine and
    // the second must fail.
    rateLimit.middleware({}, {}, function(err){
      expect(err).to.be.undefined;
    });

    rateLimit.middleware({}, {}, function(err){
      expect(err.name).to.be.equal("RateLimitExceeded");
    });

    done();
  });

});
