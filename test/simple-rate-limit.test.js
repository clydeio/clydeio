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

  it("should return error because invalid prefilter specified", function(done) {
    var configJS = require("./fixtures/config-rate-limit-global.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    rateLimit.middleware({}, {}, function(err){console.log("NEXT 1 !!!", err);});
    rateLimit.middleware({}, {}, function(err){console.log("NEXT 2 !!!", err);});
    rateLimit.middleware({}, {}, function(err){console.log("NEXT 3 !!!", err);});
    rateLimit.middleware({}, {}, function(err){console.log("NEXT 4 !!!", err);});
    rateLimit.middleware({}, {}, function(err){console.log("NEXT 5 !!!", err);});

    setTimeout(function() {
      rateLimit.middleware({}, {}, function(err){console.log("NEXT . !!!", err);});
    }, 100);

  });

});
