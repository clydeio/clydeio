"use strict";

module.exports.init = function(name, config) {
  return function(req, res, next) {
    console.log("The logger plugin ", req.url);
    next();
  };
};
