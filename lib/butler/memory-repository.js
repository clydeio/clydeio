"use strict";

var Loki = require("lokijs");
var Errors = require("./errors");


/**
 * Default butler implementation based on memory backend.
 *
 * NOTE: All operations expects well formed parameters. It is the caller's responsibility
 * to ensure the parameters are right.
 */

// Internall memory database.
var db = new Loki('butler.json');
// Create collections for each entity
var configurations = db.addCollection("configurations");
var consumersCollection = db.addCollection("consumers", {
  indices: ["id", "key"],
  unique: ["key"]
});
var providersCollection = db.addCollection("providers");
var resourcesCollection = db.addCollection("resources");
var filtersCollection = db.addCollection("filters", {
  indices: ["id"],
  unique: ["name"]
});
var filterConsumerConfigurationsCollection = db.addCollection("filterconsumerconfiguration");


// Butler implementation
var Butler = {

  /**
   * Consumers
   */

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
   * @param {Error} err Error if entity does not exists.
   * @param {Consumer} consumer Consumer instance or null if not found.
   * @returns {void}
   */
  /**
   * Get the consumer specified by the given id
   * @param  {Object} idConsumer    Identifier
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
    try {
      var consumerdb = consumersCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

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
   * @param {Object} idConsumer Consumer identifier
   * @param  {Object} props Consumer
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
    try {
      var consumer = consumersCollection.update(consumerdb);
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var consumer = {
      id: consumerdb.id,
      key: consumerdb.key,
      secret: consumerdb.secret
    };

    return cb(null, consumer);
  },

  /**
  * deleteConsumer Callback.
  * @callback deleteConsumer_cb
  * @param {Error} err Error if entity does not exists
  * @param {Object} consumer The removed Consumer instance without ID property
  * @returns {void}
  */
  /**
  * Removes a consumer and any related filter-consumer configuration.
  * @param  {Object} idConsumer Consumer identifier
  * @param  {deleteConsumer_cb} cb Callback
  * @returns {void}
  */
  deleteConsumer: function(idConsumer, cb) {
    // Check if consumer exists
    var consumerdb = consumersCollection.findOne({id: idConsumer});
    if (!consumerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Delete consumer
    try {
      consumersCollection.remove(consumerdb);
      // Remove filter-consumer configurations.
      var consumerConfigurations = filterConsumerConfigurationsCollection.find({idConsumer: idConsumer});
      for(config in consumerConfigurations) {
        filterConsumerConfigurationsCollection.remove(config);
      }
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var consumer = {
      key: consumerdb.key,
      secret: consumerdb.secret
    };

    return cb(null, consumer);
  },


  /**
   * Filters
   */

  /**
   * Callback for findFilters.
   * @callback findFilters_cb
   * @param {Error} err Error
   * @param {Array<Filter>} Array of Filter instances empty if there is none.
   */
  /**
   * Get a list of Filters.
   * @param  {findFilters_cb} cb Callback
   * @returns {void}
   */
  findFilters: function(cb) {
    var filters = filtersCollection.find();
    return cb(null, filters);
  },

  /**
   * getFilterById Callback.
   * @callback getFilterById_cb
   * @param {Error} err Error if entity does not exists.
   * @param {Filter} filter Filter instance or null if not found.
   * @returns {void}
   */
  /**
   * Get the filter specified by the given id
   * @param  {Object} idFilter    Identifier
   * @param  {getFilterById_cb} cb Callback
   * @returns {void}
   */
  getFilterById: function(idFilter, cb) {
    var filter = filtersCollection.findOne({id: idFilter});
    if (!filter) {
      return cb(new Errors.NoEntityFound());
    }
    return cb(null, filter);
  },

  /**
   * addFilter Callback.
   * @callback addFilter_cb
   * @param {Error} err Error if the specified 'name' value already is used by another filter.
   * @param {Filter} filter Filter instance
   * @returns {void}
   */
  /**
   * Creates a new filter
   * @param  {Object} props Object with properties required to create a filter instance
   * @param  {addFilter_cb} cb Callback
   * @returns {void}
   */
  addFilter: function(props, cb) {
    // Check name exists
    if (filtersCollection.findOne({name: props.name})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Store filter
    try {
      var filterdb = filtersCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var filter = {
      id: filterdb.id,
      module: filterdb.module,
      name: filterdb.name,
      description: filterdb.description,
      config: filterdb.config
    };

    return cb(null, filter);
  },

  /**
   * updateFilter Callback.
   * @callback updateFilter_cb
   * @param {Error} err Error if the specified filter ID does not exists or
   * the specified 'name' value already is used by another filter.
   * @param {Filter} filter Filter instance or null if not found.
   * @returns {void}
   */
  /**
   * Saves (updates) a filter within the configuration.
   * @param {Object} idFilter Filter identifier
   * @param  {Object} props Filter
   * @param  {updateFilter_cb} cb Callback
   * @returns {void}
   */
  updateFilter: function(idFilter, props, cb) {
    // Check if filter exists
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }
    // Check name exists
    // NOTE: Probably is better let loky to check this applying a ensureUnique constrain
    if (filtersCollection.findOne({name: props.name})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Update properties
    filterdb.module = props.module || filterdb.module;
    filterdb.name = props.name || filterdb.name;
    filterdb.description = props.description || filterdb.description;
    filterdb.config = props.config || filterdb.config;

    // Update filter
    try {
      var filter = filtersCollection.update(filterdb);
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var filter = {
      id: filterdb.id,
      module: filterdb.module,
      name: filterdb.name,
      description: filterdb.description,
      config: filterdb.config
    };

    return cb(null, filter);
  },

  /**
  * deleteFilter Callback.
  * @callback deleteFilter_cb
  * @param {Error} err Error if entity does not exists or filter has associated
  * any consumer configurations.
  * @param {Object} filter The removed Filter instance without ID property
  * @returns {void}
  */
  /**
  * Removes a filter from the configuration.
  * @param  {Object} idFilter Filter identifier
  * @param  {deleteFilter_cb} cb Callback
  * @returns {void}
  */
  deleteFilter: function(idFilter, cb) {
    // Check if filter exists
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // TODO - Check if has consumer's configurations

    // Delete filter
    try {
      filtersCollection.remove(filterdb);
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var filter = {
      module: filterdb.module,
      name: filterdb.name,
      description: filterdb.description,
      config: filterdb.config
    };

    return cb(null, filter);
  },

  /**
   * Callback for findFilterConsumerConfigs.
   * @callback findFilterConsumerConfigs_cb
   * @param {Error} err Error if especified filter does not exits.
   * @param {Array<Object>} Array of configuration object or empty if there is none.
   */
  /**
   * Get a list of configurations.
   * @param  {findFilterConsumerConfigs_cb} cb Callback
   * @returns {void}
   */
  findFilterConsumerConfigs: function(idFilter, cb) {
    var configs = filterConsumerConfigurationsCollection.find({idFilter: idFilter});
    return cb(null, configs);
  },


};


module.exports = Butler;
