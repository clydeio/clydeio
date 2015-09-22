"use strict";

var loki = require("lokijs");
var Errors = require("./errors");


/**
 * Default butler implementation based on memory backend.
 *
 * NOTE: All operations expects well formed parameters. It is callers responsibility
 * to ensure the parameters are right.
 */

// Internall memory database.
var db = new loki('butler.json');
// Create collections for each entity
var configurations = db.addCollection("configurations");
var consumersCollection = db.addCollection("consumers");
var providersCollection = db.addCollection("providers");
var resourcesCollection = db.addCollection("resources");
var filtersCollection = db.addCollection("filters");


// Butler implementation
var Butler = {

  /**
   * Callback for findConsumers.
   * @callback findConsumers_cb
   * @param {Error} err Error
   * @param {Array<Consumer>} Array of Consumer instances empty if there is none.
   */
  /**
   * Get a list of Consumers.
   * @param  {findConsumers_cb} cb Callback
   * @returns {void}
   */
  findConsumers: function(cb) {
    var consumers = consumersCollection.find();
    return cb(null, consumers);
  },

  /**
   * getConsumerById Callback.
   * @callback getConsumerById_cb
   * @param {Error} err Error
   * @param {Consumer} consumer Consumer instance or null if not found.
   * @returns {void}
   */
  /**
   * Get the consumer specified by the given id
   * @param  {String} idConsumer    Identifier
   * @param  {getConsumerById_cb} cb Callback
   * @returns {void}
   */
  getConsumerById: function(idConsumer, cb) {
    var consumer = consumersCollection.findOne({id: idConsumer});
    if (!consumer) {
      return cb(new Errors.NoEntityFound());
    }
    return cb(null, consumer);
  },

  /**
   * addConsumer Callback.
   * @callback addConsumer_cb
   * @param {Error} err Error if the specified 'key' value already is used by another consumer.
   * @param {Consumer} consumer Consumer instance
   * @returns {void}
   */
  /**
   * Creates a new consumer
   * @param  {Object} props Object with properties required to create a consumer instance
   * @param  {addConsumer_cb} cb Callback
   * @returns {void}
   */
  addConsumer: function(props, cb) {
    // Check key exists
    if (consumersCollection.findOne({key: props.key})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Store consumer
    // TODO - Manage errors
    var consumerdb = consumersCollection.insert(props);

    // Cleanup loki properties
    var consumer = {
      id: consumerdb.id,
      key: consumerdb.key,
      secret: consumerdb.secret
    };

    return cb(null, consumer);
  },

  /**
   * updateConsumer Callback.
   * @callback updateConsumer_cb
   * @param {Error} err Error if the specified consumer ID does not exists or
   * the specified 'key' value already is used by another consumer.
   * @param {Consumer} consumer Consumer instance or null if not found.
   * @returns {void}
   */
  /**
   * Saves (updates) a consumer within the configuration.
   * @param  {Consumer} props Consumer
   * @param  {updateConsumer_cb} cb Callback
   * @returns {void}
   */
  updateConsumer: function(idConsumer, props, cb) {
    // Check if consumer exists
    var consumerdb = consumersCollection.findOne({id: idConsumer});
    if (!consumerdb) {
      return cb(new Errors.NoEntityFound());
    }
    // Check key exists
    // NOTE: Probably is better let loky to check this applying a ensureUnique constrain 
    if (consumersCollection.findOne({key: props.key})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Update properties
    consumerdb.key = props.key || consumerdb.key;
    consumerdb.secret = props.secret || consumerdb.secret;

    // Update consumer
    // TODO - Handler errors
    var consumer = consumersCollection.update(consumerdb);

    // Cleanup loki properties
    var consumer = {
      id: consumerdb.id,
      key: consumerdb.key,
      secret: consumerdb.secret
    };

    return cb(null, consumer);
  }

};


module.exports = Butler;
