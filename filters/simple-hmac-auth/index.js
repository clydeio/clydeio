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

  /**
   * Provider function to get secret value from a given key value.
   *
   * @param  {String} key The key
   * @param  {Function} callback Callback to be invoked. 
   * @returns {String} The secret associated with the key
   */
  function credentialProvider(key, callback) {
    process.nextTick(function() {
      var secret = config.consumers[key];
      if(!secret) {
        return callback(null);
      }
      console.log("--->", {key: key, secret: secret});
      return callback({key: key, secret: secret});
    });
  }

  // Hmmac options
  var options = {
    algorithm: "sha256",
    acceptableDateSkew: 900, // in seconds, def 15 minutes. only done if date is signed
    credentialProvider: credentialProvider,
    credentialProviderTimeout: 15, // in seconds. time to wait for credentialProvider to return
    signatureEncoding: "hex", // signature encoding. valid = binary, hex or base64
    signedHeaders: [ "host", "content-type", "date" ],
    wwwAuthenticateRealm: config.realm || "clyde",
    scheme: Hmmac.schemes.load("plain")
  };

  // Return hmmac middleware
  return Hmmac.middleware(options);
};
