"use strict";

var util = require("util");


/**
 * Error class indicating the specified entity is duplicated
 * @class
 * @param {String} message Message
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
 * @param {String} message Message
 */
function NoEntityFound(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || "No entity found.";
}
util.inherits(NoEntityFound, Error);


/**
 * Error class indicating the specified entity has relations to other entities.
 * @class
 * @param {String} message Message
 */
function EntityWithRelations(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || "Entity with relations.";
}
util.inherits(EntityWithRelations, Error);



module.exports.DuplicatedEntity = DuplicatedEntity;
module.exports.NoEntityFound = NoEntityFound;
module.exports.EntityWithRelations = EntityWithRelations;
