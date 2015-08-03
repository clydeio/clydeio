"use strict";

var path = require("path"),
    expect = require("chai").expect,
    configuration = require("../lib/configuration"),
    InvalidConfiguration = require("../lib/errors/invalid-configuration");


describe("configuration", function() {

  it("should fail because invalid configuration object", function() {
    try {
      configuration.load("not a config object");
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.EMPTY_MESSAGE);
    }
  });

  it("should fail because at least one provider must be specified", function() {
    try {
      configuration.load({});
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.NO_PROVIDER_MESSAGE);
    }
  });

  it("should fail because provider has no 'id'", function() {
    var options = {
      providers: [
        {
          context: "/provider",
          target: "http://server:port"
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_PROVIDER_MESSAGE);
    }
  });

  it("should fail because provider has no 'target'", function() {
    var options = {
      providers: [
        {
          id: "id",
          context: "/provider"
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_PROVIDER_MESSAGE);
    }
  });

  it("should fail because provider has no context'", function() {
    var options = {
      providers: [
        {
          id: "id",
          target: "http://server:port"
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_PROVIDER_MESSAGE);
    }
  });

  it("should success loading provider configuration", function() {
    var options = {
      providers: [
        {
          id: "id",
          context: "/path",
          target: "http://server:port"
        }
      ]
    };

    var config = configuration.load(options);
    expect(Object.keys(config.providers).length).to.be.equal(1);
    expect(config.id).to.be.equal(options.id);
    expect(config.context).to.be.equal(options.context);
    expect(config.target).to.be.equal(options.target);
    expect(config.prefilters).to.have.length(0);
    expect(config.postfilters).to.have.length(0);
  });

  it("should fail because filter has no 'id'", function() {
    var options = {
      prefilters: [
        {
          path: "some_dir"
        }
      ],
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port"
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_FILTER_MESSAGE);
    }
  });

  it("should fail because filter has no 'path'", function() {
    var options = {
      prefilters: [
        {
          id: "id"
        }
      ],
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port"
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_FILTER_MESSAGE);
    }
  });

  it("should success loading prefilter configuration", function() {
    var options = {
      prefilters: [
        {
          id: "id",
          path: "../test/stubs/filter.js"
        }
      ],
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port"
        }
      ]
    };

    var config = configuration.load(options);
    expect(Object.keys(config.providers).length).to.be.equal(1);
    expect(config.id).to.be.equal(options.id);
    expect(config.context).to.be.equal(options.context);
    expect(config.target).to.be.equal(options.target);
    expect(config.prefilters).to.have.length(1);
    expect(config.prefilters[0].id).to.be.equal(options.prefilters[0].id);
    // Configuration converts path to absolute so we need to compare to an absolute path.
    expect(config.prefilters[0].path).to.be.equal(path.join(__dirname, "..", "filter", options.prefilters[0].path));
    expect(config.postfilters).to.have.length(0);
  });

  it("should fail because provider's resource has no 'id'", function() {
    var options = {
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port",
          resources: [
            {
              context: "/resource"
            }
          ]
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_RESOURCE_MESSAGE);
    }
  });

  it("should fail because provider's resource has no 'context'", function() {
    var options = {
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port",
          resources: [
            {
              id: "idResource"
            }
          ]
        }
      ]
    };

    try {
      configuration.load(options);
    } catch(err) {
      expect(err).to.be.instanceof(InvalidConfiguration);
      expect(err.message).to.contains(InvalidConfiguration.INVALID_RESOURCE_MESSAGE);
    }
  });

  it("should success loading a provider with resource", function() {
    var options = {
      providers: [
        {
          id: "id",
          context: "/provider",
          target: "http://server:port",
          resources: [
            {
              id: "idResource",
              context: "/context"
            }
          ]
        }
      ]
    };

    var config = configuration.load(options);
    expect(Object.keys(config.providers).length).to.be.equal(1);
    expect(config.providers[0].resources).to.have.length(1);
    expect(config.providers[0].resources[0].id).to.be.equal("idResource");
    expect(config.providers[0].resources[0].context).to.be.equal("/context");
  });

});
