"use strict";

/* eslint no-unused-vars:0 */

module.exports.init = function(id, config) {

  // Return a middleware
  return function(req, res, next) {
    console.log("Called filter stubs/filter");
    next();
  };

};
