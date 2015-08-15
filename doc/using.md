# Using Clyde

Clyde can be used as standalone application or as a connection listener (or middleware).

## Standalone Application

To use Clyde as standalone application you need to execute the `bin/index.js` script.

> Check the `bin/index.js` script has execution permissions or execute it using `> node bin/index.js` otherwise.

The `bin/index.js` script requires one parameter that must be the JSON configuration file to be used to configure Clyde.

Run `bin/index.js --help` to run the usage options of the program:

```
>  ./bin/index.js --help
Usage: bin/index.js [options] config_file

Options:
  --logfile   Path to the log file. Default 'clyde.log'.
  --loglevel  Level used for clyde log messages. Default 'info'.
  --port      Port where clyde will listen. Default 8080.
  --help      Show help

Examples:
  bin/index.js config.json              Start clyde reading configuration from 'config.json' file.
  bin/index.js --log debug config.json  Start clyde with log messages on 'debug' level and reading configuration from 'config.json' file.
```

> Note, `logfile` and `loglevel` can also be specified in the configuration file but are overridden by the command line options if present.

## Connection listener (or middleware)

Clyde can also be used as a connection listener, in an HTTP/S server, or as a middleware on an express or connect based applications. To do so you must:

* Install Clyde as an npm dependency of your application.
* Require the `clyde` module.
* Create a Clyde middleware (initialized with desired options) with `createMiddleware()` method:

```javascript
var clyde = require("clyde");
var options = {
  // Configuration options
};
var middleware = clyde.createMiddleware(options);
```

The `createMiddleware()` method returns a function with the signature `function(req, res, next) {...}` that can be used both as a connection listener or as middleware. So, at this point we can create a HTTP server using the `middleware` variable:

```javascript
var server = http.createServer(middleware);
server.listen(9999);
```
