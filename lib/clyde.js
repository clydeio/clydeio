"use strict";

var path = require("path"),
    connect = require("connect"),
    httpProxy = require("http-proxy"),
    path = require("path"),
    configuration = require("./configuration"),
    log = require("./log");


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

  // TODO - Add a middleware to check if request corresponds to any provider.context


  // clyde.use(function(req, res, next) {
  //   console.log("pre ", req.url);
  //   next();
  // });

  // var a = clyde.use("/a", function(req, res, next){
  //   console.log("/a ", req.url);
  //   next();
  // });

  // a.use(function(req, res, next) {
  //   console.log("/a/b", req.url);
  //   next();
  // });


  // Add prefilters middlewares
  middlewares.prefilters.forEach(function(filter) {
    clyde.use(filter);
  });

  // Add providers routing and its filters middlewares
  var index, 
      num = middlewares.providers.length, 
      provider,
      proxy = httpProxy.createProxyServer();

  // TODO - Temporal code to see req and errors.
  // proxy.on('proxyReq', function (proxyReq, req, res, options) {
  //   console.log("---> Proxy REQ: ", provider.context, req.headers);
  // });

  proxy.on('proxyRes', function (proxyRes, req, res) {
    console.log("---> Proxy Response (%s)[%s]", provider.context, provider.target,
      proxyRes.statusCode, req.url, res.statusCode, proxyRes.headers);
  });

  proxy.on('error', function(err){
    console.log("---> Proxy Error (%s)[%s]", provider.context, provider.target, err);
  });

  var middleware = function(provider) {
    // // Add provider filters
    provider.filters.forEach(function(filter) {
      clyde.use(provider.context, filter);
    });

    // Add provider middleware
    clyde.use(provider.context, function(req, res, next) {

      console.log("-> provider ", provider.context, req.url);

      proxy.web(req, res, {
        target: provider.target
      });
    });
  };

  for(index = 0; index < num; index++) {
    provider = middlewares.providers[index];

    // Add provider's proxy
    middleware(provider);
  }

  // Add postfilters middlewares
  middlewares.postfilters.forEach(function(filter) {
    clyde.use(filter);
  });


  // Error 404
  // clyde.use(function(req, res, next) {
  //   var err = new Error("Not Found");
  //   err.status = 404;
  //   next(err);
  // });

  // Error 500
  // clyde.use(function(err, req, res, next) {
  //   var status = err.status || 500;
  //   console.log("------> Server error ", err);
  // });

  return clyde;
};





// /// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error("Not Found");
//     err.status = 404;
//     next(err);
// });

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


// module.exports = app;
