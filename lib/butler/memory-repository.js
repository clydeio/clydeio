"use strict";

/**
 * Default butler implementation based on memory backend.
 *
 * NOTE: All operations expects well formed parameters. It is callers responsibility
 * to ensure the parameters are right.
 */

var loki = require("lokijs");

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
   * findConsumerById Callback.
   * @callback findConsumerById_cb
   * @param {Error} err Error
   * @param {Consumer} consumer Consumer instance or null if not found.
   * @returns {void}
   */
  /**
   * Get the consumer specified by the given id
   * @param  {String} idConsumer    Identifier
   * @param  {findConsumerById_cb} cb Callback
   * @returns {void}
   */
  findConsumerById: function(idConsumer, cb) {
    var consumer = consumersCollection.findOne({id: idConsumer});
    if (!consumer) {
      return cb(null, null);
    }
    // Reconstruct consumer
    return cb(null, consumer);
  },

  /**
   * addConsumer Callback.
   * @callback addConsumer_cb
   * @param {Error} err Error if the specified 'key' value duplicated by another consumer.
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

    // TODO
    // Check key exists
    // create consumer

    var consumer = consumersCollection.findOne({key: props.key});
    if (!consumer) {
      return cb(null, null);
    }


    // Check if consumer exists with the same key and return duplicated entity error
    if (_.find(backend.consumers, {key: consumer.key})) {
      return cb(new DuplicatedEntity("Duplicated consumer. There is another consumer with the same 'key'."));
    }

    var consumerBackend = Mapper.consumerToBackend(consumer);
    backend.consumers.push(consumerBackend);
    return cb(null, consumer);
  }

};


module.exports = Butler;
