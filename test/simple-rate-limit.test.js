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

  it("should return error because invalid prefilter specified", function() {
    var configJS = require("./fixtures/config-rate-limit-global.json");
    var config = configuration.load(configJS);
    var rateLimit = config.getPrefilterByName("rate-limit");

    console.log("RATE: ----> ", rateLimit.middleware);

    rateLimit.middleware();

  });

});
