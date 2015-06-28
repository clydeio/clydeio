"use strict";

var getRawBody = require('raw-body');

/**
 * Blocks requests depending on its body's length.
 *
 * @example
 * {
 *   "limit" : "100b"
 * }
 *
 * @public
 * @param  {String} name Name of the filter
 * @param  {Object} config JavaScript object with filter configuration
 * @returns {Function} Middleware function implementing the filter.
 */
module.exports.init = function(name, config) {

  return function(req, res, next) {
    getRawBody(req, {
      length: config.length,
      encoding: config.encoding,
      limit: config.limit
    }, function (err, string) {
      if (err) {
        return next(err);
      }
      next();
    });
  };

};
