/* eslint no-unused-vars:0 */
"use strict";

var expect = require("chai").expect;
var configuration = require("../lib/configuration");
var InvalidConfiguration = require("../lib/errors/invalid-configuration");


describe("configuration", function() {

  before(function() {
    configuration.base(__dirname);
  });

  it("should return error because invalid configuration object", function() {
    try {
      var config = configuration.load("not a config object");
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.be.equal(InvalidConfiguration.EMPTY_MESSAGE);
    }
  });

  it("should return error because at least one provider must be specified", function() {
    try {
      var config = configuration.load({});
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.be.equal(InvalidConfiguration.NO_PROVIDER_MESSAGE);
    }
  });

  it("should return error because invalid prefilter specified", function() {
    var configJS = require("./fixtures/config-invalid-prefilter.json");

    try {
      var config = configuration.load(configJS);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.be.equal(InvalidConfiguration.INVALID_FILTER_MESSAGE);
    }
  });

  it("should return a configuration with one prefilter", function() {
    var configJS = require("./fixtures/config-one-prefilter.json");

    var config = configuration.load(configJS);
    expect(config.prefilters).to.have.length(1);
  });

  it("should return a configuration with one postfilter", function() {
    var configJS = require("./fixtures/config-one-postfilter.json");

    var config = configuration.load(configJS);
    expect(config.postfilters).to.have.length(1);
  });

  it("should return error because invalid provider specified", function() {
    var configJS = require("./fixtures/config-invalid-provider.json");

    try {
      var config = configuration.load(configJS);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.be.equal(InvalidConfiguration.INVALID_PROVIDER_MESSAGE);
    }
  });

  it("should return a configuration with a providers array property with one provider", function() {
    var configJS = require("./fixtures/config-one-provider-no-filter.json");

    var config = configuration.load(configJS);
    expect(Object.keys(config.providers).length).to.be.equal(1);
    expect(config.context).to.be.equal(configJS.context);
    expect(config.name).to.be.equal(configJS.name);
    expect(config.target).to.be.equal(configJS.target);
    expect(config.prefilters).to.have.length(0);
    expect(config.postfilters).to.have.length(0);
  });


});
