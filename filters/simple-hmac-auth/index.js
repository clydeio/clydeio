"use strict";

var Hmmac = require("hmmac");


/**
 * Simple plain HMAC authentication implementation based on hmmac package.
 * Allowed configuration properties:
 *
 * @example
 * {
 *   "realm" : "clyde",
 *   "consumers" : {
 *     "keyA" : "secretA"
 *   }
 * }
 *
 * Only the "consumers" property is required and must contains at least one
 * consumer.
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {object} config JavaScript object with filter configuration
 * @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  // Check for configuration parameters
  if (!config || !config.consumers || Object.keys(config.consumers).length === 0) {
    throw new Error("'simple-hmac-auth': Invalid filter parameters !!! At least one consumer must be specified");
  }

  // Provider function to get secret value from a given key value.
  function credentialProvider(key, callback) {
    var secret = config.consumers[key];
    if (!secret) {
      return callback(null);
    }
    return callback({key: key, secret: secret});
  }

  // Hmmac options
  var options = {
    algorithm: "sha256",
    acceptableDateSkew: 900, // in seconds, def 15 minutes. only done if date is signed
    credentialProvider: credentialProvider,
    credentialProviderTimeout: 1, // in seconds. time to wait for credentialProvider to return
    signatureEncoding: "hex", // signature encoding. valid = binary, hex or base64
    signedHeaders: [ "host", "content-type", "date" ],
    wwwAuthenticateRealm: config.realm || "clyde",
    scheme: Hmmac.schemes.load("plain")
  };
  // Create hmmac instance
  var hmmac = new Hmmac(options);

  // Custom responder function.
  function customResponder(valid, req, res, next) {
    if (valid === true) {
      return next();
    } else {
      res.statusCode = 401;
      if (hmmac.config.wwwAuthenticateRealm) {
        res.setHeader("WWW-Authenticate", hmmac.config.scheme.getServiceLabel.call(hmmac)
          + " realm=\"" + hmmac.config.wwwAuthenticateRealm.replace(/"/g, "'") + "\"");
      }
      var err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }
  }

  // Return hmmac middleware
  return Hmmac.middleware(hmmac, customResponder);
};
