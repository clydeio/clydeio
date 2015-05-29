"use strict";

var path = require("path"),
    connect = require("connect"),
    log = require("./log");
    // httpProxy = require("http-proxy");


function loadProviders(providers) {
  var providers = providers.map(function(p) {
    // TODO - For each provide we need to create the corresponding middleware
    return {context: p.context, provider: p };
  }).reduce(function(prev, n) {
    prev[n.context] = n.target;
    return prev;
  }, {});

  return providers;
}

function ConfigurationFactory(config) {
  var config = {
    prefilters: {},
    providers: {},
    postfilters: {}
  };


}

/**
 * Router middleware responsible to detect the target server from the request.
 * Request object is modified adding a new 'target' property with the target
 * server or throwing an error otherwise.
 * 
 */
function router(req, res, next) {
  log.trace({req: req, res: res}, "Router request...");

  var context = req.url,
      contextIndex = context.indexOf("/", 1);

  if(contextIndex !== -1) {
    context = context.substring(0, contextIndex);
  }

  console.log("--> URL: ", req.url, " CONTEXT: ", context, contextIndex);

  next();
}

var providers = {};

/**
 * The proxy server used to publish private APIs.
 * @param {object} config Object with JSON configuration
 * @returns {object} Connect application instance
 */
module.exports.createProxyServer = function(config) {

  var configuration = ConfigurationFactory(config);

console.log("CONFIG: ", config);
  

  // var plugins = loadPlugins(config.filters);
  // providers = loadProviders(config.routes);

  // console.log("PROVIDERS: ", providers);

  var clyde = connect();
  // var r = clyde.use(router);

  var a = clyde.use("/a", function(req, res, next) {
    console.log("/a called");
    next();
  });

  var a1 = clyde.use("/a/1", function(req, res, next) {
    console.log("/1 called");
    next();
  });

  var b = clyde.use("/b", function(req, res, next) {
    console.log("/b called");
    next();
  });

  var c = clyde.use("/c", function(req, res, next) {
    console.log("/c");
    next();
  });
  c.use("/c", function(req, res, next) {
    console.log("/c segundo");
    next();
  });



// clyde.use(mid2);

// var proxy = httpProxy.createProxyServer(options);
// clyde.use(function(req, res){
//   // Proxy request to the right target server
//   proxy.web(req, res, {
//     target: req.targetServer  // TODO - this is suppose to be computed by a previous 'router' middleware
//   })
// });

  return clyde;
};


// "use strict";

// var path = require("path");
// var logger = require("morgan");



// var app = express();

// // view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");

// var env = process.env.NODE_ENV || "development";
// app.locals.ENV = env;
// app.locals.ENV_DEVELOPMENT = env == "development";

// // app.use(favicon(__dirname + "/public/img/favicon.ico"));
// app.use(logger("dev"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//   extended: true
// }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

// app.use("/", routes);
// app.use("/users", users);





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
