"use strict";

var util = require("util");


/**
 * Error class indicating the specified entity is duplicated
 * @class
 */
function DuplicatedEntity(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || "Duplicated entity.";
}
util.inherits(DuplicatedEntity, Error);


/**
 * Error class indicating the specified entity does not exists.
 * @class
 */
function NoEntityFound(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || "No entity found";
}
util.inherits(NoEntityFound, Error);


module.exports.DuplicatedEntity = DuplicatedEntity;
module.exports.NoEntityFound = NoEntityFound;
