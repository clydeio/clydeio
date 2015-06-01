"use strict";

var path = require("path"),
    connect = require("connect"),
    httpProxy = require("http-proxy"),
    path = require("path"),
    configuration = require("./configuration"),
    log = require("./log");


/**
 * Given a provider register all its filters and proxy the requests.
 * 
 * @param  {[type]} provider [description]
 * @return {[type]}          [description]
 */
var registerProviderMiddleware = function(clyde, proxy, provider) {

  // Add provider prefilters
  provider.prefilters.forEach(function(filter) {
    clyde.use(provider.context, filter);
  });

  // Add provider middleware
  clyde.use(provider.context, function(req, res, next) {

    // Create flag to indicate request has been processes by a provider.
    req.clydeProvider = provider.context;

    console.log("-> provider ", provider.context, req.url);

    // Proxy request to the provider
    proxy.web(req, res, {
      target: provider.target
    }, function(err, req, res, target) {
      // Manage error per request
      console.log("---> Proxy Error (%s)[%s]", provider.context, provider.target, err, target);
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Something went wrong. And we are reporting a custom error message.');

      next(new Error("--> PUTADON 500 !!!"));
    });

    // Wait response finished and continue middleware chain.
    res.on('finish', function() {
      next();
    });

  });

  // Add provider postfilters
  provider.postfilters.forEach(function(filter) {
    clyde.use(provider.context, filter);
  });
};


/**
 * The proxy server used to publish private APIs.
 * @param {object} config Object with JSON configuration
 * @returns {object} Connect application instance
 */
module.exports.createProxyServer = function(config) {

  // Filter will be loaded from the parent folder
  configuration.base(path.join(__dirname, ".."));
  var middlewares = configuration.load(config);

  var clyde = connect();

  // Add prefilters middlewares
  middlewares.prefilters.forEach(function(filter) {
    clyde.use(filter);
  });

  // Add providers routing and its filters middlewares
  var index, 
      num = middlewares.providers.length, 
      proxy = httpProxy.createProxyServer();

  for(index = 0; index < num; index++) {
    registerProviderMiddleware(clyde, proxy, middlewares.providers[index]);
  }

  // Check if request has been processed by a provider and throw 404 error
  clyde.use(function(req, res, next) {
    var err = null;
    if(!req.clydeProvider) {
      err = new Error("No provider found !!!");
      err.status = 404;
    }
    next(err);
  });

  // Add postfilters middlewares
  middlewares.postfilters.forEach(function(filter) {
    clyde.use(filter);
  });


  // Error 500
  clyde.use(function(err, req, res, next) {
    var status = err.status || 500;
    console.log("------> Server error 500", err);
  });

  return clyde;
};


// /// error handlers

// // development error handler
// // will print stacktrace

// if (app.get("env") === "development") {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render("error", {
//             message: err.message,
//             error: err,
//             title: "error"
//         });
//     });
// }

// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render("error", {
//         message: err.message,
//         error: {},
//         title: "error"
//     });
// });
