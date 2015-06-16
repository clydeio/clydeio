"use strict";

var Hmmac = require("hmmac");


module.exports.init = function(name, config) {


  function credentialProvider(key, callback) {

    console.error("--------> credentialProvider ----> ", key);

    //T ODO - Get key/secret
    callback({
      key: "key",
      secret: "secret"
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
    wwwAuthenticateRealm: "API",
    scheme: Hmmac.schemes.load("plain")
  };

  // Return hmmac middleware
  return Hmmac.middleware(options);
};
