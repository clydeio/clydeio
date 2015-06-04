"use strict";

var path = require("path"),
    connect = require("connect"),
    httpProxy = require("http-proxy"),
    configuration = require("./configuration"),
    log = require("./log");


/**
 * Add provider to the chain of application middlewares.
 *
 * @private
 * @param  {object} clyde Application reference
 * @param  {http-proxy} proxy Proxy instance to proxy requests.
 * @param  {object} provider Provider configuration
 * @returns {void}
 */
function registerProviderMiddleware(clyde, proxy, provider) {

  // Add provider prefilters
  provider.prefilters.forEach(function(filter) {
    // This is only for log purposes
    clyde.use(function(req, res, next) {
      log.debug({req: req}, "Running prefilter '%s' on provider '%s'...",
        filter.name, provider.name);
      next();
    });

    // Add prefilter
    clyde.use(provider.context, filter.middleware);
  });

  // Add provider middleware
  clyde.use(provider.context, function(req, res, next) {

    // Create flag to indicate request has been processes by a provider.
    req.clydeProvider = provider.context;

    log.debug({req: req}, "Proxy request to provider '%s'...", provider.name);

    // Proxy request to the provider
    proxy.web(req, res, {
      target: provider.target
    }, function(err) {
      // Manage error per request
      next(err);
    });

    // Wait response finished and continue middleware chain.
    res.on("finish", function() {
      next();
    });

  });

  // Add provider postfilters
  provider.postfilters.forEach(function(filter) {
    // This is only for log purposes
    clyde.use(function(request, response, next) {
      log.debug({req: request}, "Running postfilter '%s' on provider '%s'...",
        filter.name, provider.name);
      next();
    });

    // Add postfilter
    clyde.use(provider.context, filter.middleware);
  });
}


/**
 * Creates a new application instance (a middleware) that allows to publish
 * the providers specified in the configuration file.
 *
 * @param  {object} config JavaScript object with the configuration.
 * @returns {middleware} Application instance, a request-response handler
 * following middleware pattern.
 */
module.exports.createProxyServer = function(config) {

  // Filter will be loaded from the parent folder
  configuration.base(path.join(__dirname, ".."));
  var middlewares = configuration.load(config);

  var clyde = connect();

  // Add prefilters middlewares
  middlewares.prefilters.forEach(function(filter) {
    // This is only for log purposes
    clyde.use(function(req, res, next) {
      log.debug({req: req}, "Running prefilter '%s'...", filter.name);
      next();
    });

    // Add prefilter
    clyde.use(filter.middleware);
  });

  // Proxy used to route request to providers.
  var proxy = httpProxy.createProxyServer();

  // Add providers routing and its filters middlewares
  var index,
      num = middlewares.providers.length;
  for (index = 0; index < num; index++) {
    registerProviderMiddleware(clyde, proxy, middlewares.providers[index]);
  }

  // Check if request has been processed by a provider and throw 404 error
  clyde.use(function(req, res, next) {
    var err = null;
    if (!req.clydeProvider) {
      err = new Error("No provider found for the request !!!");
      err.status = 404;
    }
    next(err);
  });

  // Add postfilters middlewares
  middlewares.postfilters.forEach(function(filter) {
    // This is only for log purposes
    clyde.use(function(req, res, next) {
      log.debug({req: req}, "Running postfilter '%s'...", filter.name);
      next();
    });

    // Add postfilter
    clyde.use(filter.middleware);
  });

  // Error 500
  clyde.use(function(err, req, res, next) {
    var statusCode = err.status || 500;

    log.debug({req: req, err: err}, err.message);

    res.writeHead(statusCode, {"Content-Type": "text/plain"});
    res.end(err.message);
    next();
  });

  return clyde;
};
