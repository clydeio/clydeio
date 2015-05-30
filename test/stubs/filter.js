"use strict";

module.exports.init = function(name, config) {

  // Return a middleware
  return function(req, res, next) {
    console.log("Called filter stubs/filter");
    next();
  }

};
