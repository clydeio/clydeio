"use strict";

var connect = require("connect"),
    httpProxy = require("http-proxy"),
    configuration = require("./configuration"),
    NoProviderFound = require("./errors/no-provider-found.js");


/**
 * Clyde constructor
 *
 * @constructor
 * @param {Object} options Configuration options
 */
function Clyde(options) {
  // Options
  this.options = options;

  // Initialize log with options
  this.log = require("./log")(this.options);

  // Proxy instance to be used to route request to providers.
  this.proxy = httpProxy.createProxyServer();

  // Create root middleware
  this.root = connect();
}


/**
 * Builds and returns a middleware that runs the specified configuration.
 *
 * @public
 * @returns {Function} Middleware function
 */
Clyde.prototype.middleware = function() {

  // Initialize log with options
  var log = this.log;

  // Load configuration middlewares (filters and providers)
  var middlewares = configuration.load(this.options);

  //
  // Add prefilters middlewares
  //
  middlewares.prefilters.forEach(function(filter) {
    // Log before
    this.root.use(function(req, res, next) {
      log.debug({filter: filter.id}, "Before apply prefilter...");
      next();
    });
    // Filter middleware
    this.root.use(filter.middleware);
    // Log after
    this.root.use(function(req, res, next) {
      log.debug({filter: filter.id}, "After apply prefilter...");
      next();
    });
  }, this);

  //
  // Add providers and its filters middlewares
  //
  var index,
      num = middlewares.providers.length,
      providers = middlewares.providers;
  for (index = 0; index < num; index++) {
    this.registerProviderMiddleware(providers[index]);
  }

  //
  // Check if request has been processed by a provider and throw 404 error
  //
  this.root.use(function(req, res, next) {
    if (!req.provider) {
      next(new NoProviderFound());
    }
    next();
  });

  //
  // Add postfilters middlewares
  //
  middlewares.postfilters.forEach(function(filter) {
    // Log before
    this.root.use(function(req, res, next) {
      log.debug({filter: filter.id}, "Before apply postfilter...");
      next();
    });
    // Filter middleware
    this.root.use(filter.middleware);
    // Log after
    this.root.use(function(req, res, next) {
      log.debug({filter: filter.id}, "After apply postfilter...");
      next();
    });
  }, this);

  // Attach error handler
  this.root.use(this.errorHandler());

  return this.root;
};


/**
 * Add provider to the chain of application middlewares.
 *
 * @private
 * @param  {object} provider Provider configuration
 * @returns {void}
 */
Clyde.prototype.registerProviderMiddleware = function(provider) {

  var log = this.log,
      proxy = this.proxy;

  //
  // Store provider's information in the request. This allow to know the
  // request has entered in the "provider's zone" and also passes information
  // to filters that needs providers data.
  //
  this.root.use(provider.context, function(req, res, next) {
    req.provider = {
      providerId: provider.id,
      context: provider.context,
      target: provider.target
    };
    next();
  });

  //
  // Add provider prefilters
  //
  provider.prefilters.forEach(function(filter) {
    // Log before
    this.root.use(provider.context, function(req, res, next) {
      log.debug({filter: filter.id, provider: provider.id}, "Before apply prefilter on provider...");
      next();
    });
    // Filter middleware
    this.root.use(provider.context, filter.middleware);
    // Log after
    this.root.use(provider.context, function(req, res, next) {
      log.debug({filter: filter.id, provider: provider.id}, "After apply prefilter on provider...");
      next();
    });
  }, this);

  //
  // Add resources prefilters
  //
  provider.resources.forEach(function(resource) {
    if (resource.prefilters) {
      resource.prefilters.forEach(function(filter) {
        // Log before
        this.root.use(provider.context + resource.context, function(req, res, next) {
          log.debug({filter: filter.id, provider: provider.id, resource: resource.id}, "Before apply prefilter on provider's resource...");
          next();
        });
        // Filter middleware
        this.root.use(resource.context + resource.context, filter.middleware);
        // Log after
        this.root.use(provider.context + resource.context, function(req, res, next) {
          log.debug({filter: filter.id, provider: provider.id, resource: resource.id}, "After apply prefilter on provider's resource...");
          next();
        });
      }, this);
    }
  }, this);

  //
  // Add provider middleware
  //
  this.root.use(provider.context, function(req, res, next) {

    log.debug({req: req, provider: provider.id, target: provider.target}, "Sending request to provider...");

    // Proxy request to the provider
    proxy.web(req, res, {
      target: provider.target
    }, function(err) {
      // If there is any proxy error return the error.
      next(err);
    });

    // Log proxy response
    proxy.on("proxyRes", function(proxyRes) {
      log.debug({res: proxyRes, provider: provider.id, target: provider.target}, "Received response from provider...");
    });

    // Wait response finished and continue middleware chain.
    res.on("finish", function() {
      next();
    });
  });

  //
  // Add resources postfilters
  //
  provider.resources.forEach(function(resource) {
    if (resource.postfilters) {
      resource.postfilters.forEach(function(filter) {
        // Log before
        this.root.use(provider.context + resource.context, function(req, res, next) {
          log.debug({filter: filter.id, provider: provider.id, resource: resource.id}, "Before apply postfilter on provider's resource...");
          next();
        });
        // Filter middleware
        this.root.use(resource.context + resource.context, filter.middleware);
        // Log after
        this.root.use(provider.context + resource.context, function(req, res, next) {
          log.debug({filter: filter.id, provider: provider.id, resource: resource.id}, "After apply postfilter on provider's resource...");
          next();
        });
      }, this);
    }
  }, this);

  //
  // Add provider postfilters
  //
  provider.postfilters.forEach(function(filter) {
    // Log before
    this.root.use(provider.context, function(req, res, next) {
      log.debug({filter: filter.id, provider: provider.id}, "Before apply postfilter on provider...");
      next();
    });
    // Filter middleware
    this.root.use(provider.context, filter.middleware);
    // Log after
    this.root.use(provider.context, function(req, res, next) {
      log.debug({filter: filter.id, provider: provider.id}, "After apply postfilter on provider...");
      next();
    });
  }, this);

};


/**
 * Returns an error middleware handler.
 *
 * @private
 * @returns {Function} A middleware error handler.
 */
Clyde.prototype.errorHandler = function() {
  var log = this.log;

  return function(err, req, res, next) {  // eslint-disable-line no-unused-vars
    // NOTE: Some modules use 'statusCode' and others (like passport) uses 'status'.
    var statusCode = err.statusCode || err.status || 500,
        message = err.message;

    res.writeHead(statusCode, {
      "Content-Length": message.length,
      "Content-Type": "text/plain"
    });
    res.end(message);

    var obj = {req: req, res: res, err: err};

    if (statusCode >= 500) {
      log.warn(obj, message);
    } else {
      log.debug(obj, message);
    }
  };
};


/**
 * Creates a Clyde instance and returns its corresponding middleware responsible
 * to publish the providers specified by options.
 *
 * @param  {object} options JavaScript object with the configuration.
 * @returns {middleware} Application instance, a request-response handler
 * following middleware pattern.
 */
module.exports.createMiddleware = function(options) {
  // Apply default values to log properties if not present
  options.logfile = options.logfile || "clyde.log";
  options.loglevel = options.loglevel || "info";

  var clyde = new Clyde(options);
  return clyde.middleware();
};
