"use strict";

var path = require("path"),
    connect = require("connect"),
    httpProxy = require("http-proxy"),
    configuration = require("./configuration"),
    NoProviderFound = require("./errors/no-provider-found.js");

var log; // Log reference initialized when clyde server is created.

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
    clyde.use(provider.context, function(req, res, next) {
      log.debug({req: req, filter: filter.name, provider: provider.name}, "Before apply prefilter on provider...");
      next();
    });

    // Add prefilter
    clyde.use(provider.context, filter.middleware);
  });

  // Add provider middleware
  clyde.use(provider.context, function(req, res, next) {

    // Create flag to indicate request has been processes by a provider.
    req.provider = provider.context;

    log.debug({req: req, provider: provider.name, target: provider.target}, "Sending request to provider...");

    // Proxy request to the provider
    proxy.web(req, res, {
      target: provider.target
    }, function(err) {
      // If there is any proxy error return the error.
      next(err);
    });

    // Log proxy response
    proxy.on("proxyRes", function(proxyRes) {
      log.debug({res: proxyRes, provider: provider.name, target: provider.target}, "Received response from provider...");
    });

    // Wait response finished and continue middleware chain.
    res.on("finish", function() {
      next();
    });

  });

  // Add provider postfilters
  provider.postfilters.forEach(function(filter) {
    // Add postfilter
    clyde.use(provider.context, filter.middleware);

    // This is only for log purposes
    clyde.use(provider.context, function(request, response, next) {
      log.debug({res: response, filter: filter.name, provider: provider.name}, "After apply postfilter on provider...");
      next();
    });
  });
}


/**
 * Registers global prefilters.
 *
 * @private
 * @param  {Object} clyde Clyde reference
 * @param  {Array<Object>} prefilters Array of prefilters
 * @returns {void}
 */
function registerPrefiltersMiddleware(clyde, prefilters) {
  prefilters.forEach(function(filter) {
    // This is only for log purposes
    clyde.use(function(req, res, next) {
      log.debug({req: req, filter: filter.name}, "Before apply prefilter...");
      next();
    });

    // Add prefilter
    clyde.use(filter.middleware);
  });
}


/**
 * Registers global postfilter.
 *
 * @private
 * @param  {Object} clyde Clyde reference
 * @param  {Array<Object>} postfilters Array of postfilters
 * @returns {void}
 */
function registerPostfiltersMiddleware(clyde, postfilters) {
  postfilters.forEach(function(filter) {
    // Add postfilter
    clyde.use(filter.middleware);

    // This is only for log purposes
    clyde.use(function(req, res, next) {
      log.debug({res: res, filter: filter.name}, "After apply postfilter...");
      next();
    });
  });
}


/**
 * Error middleware handler.
 *
 * @private
 * @param  {Error} err  Error instance
 * @param  {Request} req  Request instance
 * @param  {Response} res  Response instance
 * @param  {Function} next next function
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  // NOTE: Some modules use 'statusCode' and others (like passport) uses 'status'.
  var statusCode = err.statusCode || err.status || 500;

  res.writeHead(statusCode, {"Content-Type": "text/plain"});
  res.end(err.message);

  var obj = {req: req, res: res, err: err};

  if (statusCode >= 500) {
    log.warn(obj, err.message);
  } else {
    log.debug(obj, err.message);
  }
}


/**
 * Creates a new application instance (a middleware) that allows to publish
 * the providers specified in the configuration file.
 *
 * @param  {object} options JavaScript object with the configuration.
 * @returns {middleware} Application instance, a request-response handler
 * following middleware pattern.
 */
module.exports.createProxyServer = function(options) {

  // Initialize log with options
  log = require("./log")(options);

  // Filter will be loaded from the parent folder
  configuration.base(path.join(__dirname, ".."));   // TODO - Make filters directory configurable ???
  var middlewares = configuration.load(options);

  // Proxy used to route request to providers.
  var proxy = httpProxy.createProxyServer();
  // Connect instance
  var clyde = connect();

  // Add prefilters middlewares
  registerPrefiltersMiddleware(clyde, middlewares.prefilters);

  // Add providers and its filters middlewares
  var index, num = middlewares.providers.length;
  for (index = 0; index < num; index++) {
    registerProviderMiddleware(clyde, proxy, middlewares.providers[index]);
  }

  // Check if request has been processed by a provider and throw 404 error
  clyde.use(function(req, res, next) {
    if (!req.provider) {
      next(new NoProviderFound());
    }
    next();
  });

  // Add postfilters middlewares
  registerPostfiltersMiddleware(clyde, middlewares.postfilters);

  // Attach error handler
  clyde.use(errorHandler);

  return clyde;
};
