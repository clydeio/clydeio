"use strict";

/**
 * Module dependencies.
 */
var path = require("path"),
    connect = require("connect"),
    log = require("./log");
    // httpProxy = require("http-proxy");




/**
 * Load plugins specified in the configuration.
 * @param {object} config Object with JSON configuration
 * @returns {object} Object with plugins in the form: modules[name] = plugin
 */
function loadPlugins(plugins) {
  // Map plugins to an array of {name, plugin} and reduce to an object
  // composed of properties: modules[name] = plugin
  var modules = plugins.map(function(plugin) {
    // Path relative to current dirname
    var pluginPath = path.join(__dirname, "..", plugin.path);
    log.info("Loaded plugin name '%s' on path '%s'.", plugin.name, pluginPath);
    return {name: plugin.name, plugin: require(pluginPath)};
  }).reduce(function(p, n) {
    p[n.name] = n.plugin;
    return p;
  }, {});
  return modules;
}


/**
 * Router middleware responsible to detect the target server from the request.
 * Request object is modified adding a new 'target' property with the target
 * server or throwing an error otherwise.
 * 
 */
function router(req, res, next) {
  log.trace({req: req, res: res}, "Router request...");

  next();
}

/**
 * The proxy server used to publish private APIs.
 * @param {object} config Object with JSON configuration
 * @returns {object} Connect application instance
 */
module.exports.createProxyServer = function(config) {

  var plugins = loadPlugins(config.plugins);

  var clyde = connect();
  clyde.use(router);
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


/**
 * The API server to manage Clyde
 * @param {object} config Object with JSON configuration
 * @returns {object} Connect application instance
 */
module.exports.createServer = function(config) {
  var a = config;
  return a;
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
