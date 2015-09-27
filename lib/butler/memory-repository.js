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
var db = new Loki("barkleyconfig.json");
// Create collections for each entity
var configurations = db.addCollection("configurations");
var consumersCollection = db.addCollection("consumers", {
  indices: ["id", "key"],
  unique: ["key"]
});
var providersCollection = db.addCollection("providers", {
  indices: ["id"],
  unique: ["context"]
});
var resourcesCollection = db.addCollection("resources", {
  indices: ["id", "idProvider"]
});
var filtersCollection = db.addCollection("filters", {
  indices: ["id"],
  unique: ["name"]
});
var filterConsumerConfigurationsCollection = db.addCollection("filterconsumerconfiguration");


/**
 * Barkley memory implementario
 * @class
 */
var Butler =
/** @lends Repository */
{

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
    var consumerdb = consumersCollection.findOne({id: idConsumer});
    if (!consumerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Cleanup loki properties
    var consumer = {
      key: consumerdb.key,
      secret: consumerdb.secret
    };

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
      consumerdb = consumersCollection.update(consumerdb);
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
  * @param {Object} consumer Properties of the removed consumer
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

    // Delete consumer and its configurations
    try {
      consumersCollection.remove(consumerdb);
      // Remove filter-consumer configurations.
      var consumerConfigurations = filterConsumerConfigurationsCollection.find({idConsumer: idConsumer});
      for (var i = 0; i < consumerConfigurations.length; i++) {
        filterConsumerConfigurationsCollection.remove(consumerConfigurations[i]);
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
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
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
      filterdb = filtersCollection.update(filterdb);
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

    // Check if filter has consumer's configurations
    if (filterConsumerConfigurationsCollection.findOne({idFilter: idFilter})) {
      return cb(new Errors.EntityWithRelations());
    }

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
   * Filter-Consumer configurations
   */

  /**
   * Callback for findFilterConsumerConfigsByFilter.
   * @callback findFilterConsumerConfigsByFilter_cb
   * @param {Error} err Error if especified filter does not exits.
   * @param {Array<Object>} Array of configuration object or empty if there is none.
   */
  /**
   * Get a list of configurations attached to a filter.
   * @param {Object} idFilter Identifier
   * @param  {findFilterConsumerConfigsByFilter_cb} cb Callback
   * @returns {void}
   */
  findFilterConsumerConfigsByFilter: function(idFilter, cb) {
    // Check if filter exists
    if (!filtersCollection.findOne({id: idFilter})) {
      return cb(new Errors.NoEntityFound());
    }

    var configs = filterConsumerConfigurationsCollection.find({idFilter: idFilter});
    return cb(null, configs);

    // TODO - cleanup objects
  },

  /**
   * Callback for findConsumerFilterConfigsByConsumer.
   * @callback findConsumerFilterConfigsByConsumer_cb
   * @param {Error} err Error if especified filter does not exits.
   * @param {Array<Object>} Array of configuration object or empty if there is none.
   */
  /**
   * Get a list of configurations attached to a consumer.
   * @param {Object} idConsumer Identifier
   * @param  {findConsumerFilterConfigsByConsumer_cb} cb Callback
   * @returns {void}
   */
  findConsumerFilterConfigsByConsumer: function(idConsumer, cb) {
    // Check if consumer exists
    if (!consumersCollection.findOne({id: idConsumer})) {
      return cb(new Errors.NoEntityFound());
    }

    var configs = filterConsumerConfigurationsCollection.find({idConsumer: idConsumer});
    return cb(null, configs);
    // TODO - clecnup objects
  },

  /**
   * getConsumerFilterConfigByFilterAndConsumer Callback.
   * @callback getConsumerFilterConfigByFilterAndConsumer_cb
   * @param {Error} err Error if entity does not exists.
   * @param {Object} config Concrete configuration for a given filter and consumer.
   * @returns {void}
   */
  /**
   * Get the configuration of a consumer on a given filter
   * @param  {Object} idConsumer    Identifier
   * @param  {Object} idFilter    Identifier
   * @param  {getConsumerFilterConfigByFilterAndConsumer_cb} cb Callback
   * @returns {void}
   */
  getConsumerFilterConfigByFilterAndConsumer: function(idConsumer, idFilter, cb) {
    var configdb = filterConsumerConfigurationsCollection.findOne({ "$and": [
      {idFilter: idFilter},
      {idConsumer: idConsumer}
    ]});
    if (!configdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Cleanup loki properties
    var config = {
      idFilter: configdb.idFilter,
      ifConsumer: configdb.idConsumer,
      config: configdb.config
    };

    return cb(null, config);
  },


  /**
   * addConsumerFilterConfig Callback.
   * @callback addConsumerFilterConfig_cb
   * @param {Error} err Error if filter or config does not exists or the given
   * consumer and filter has already a configuration.
   * @param {Object} configuration Configuration
   * @returns {void}
   */
  /**
   * Creates a new filter-consumer configuration
   * @param  {Object} idConsumer    Identifier
   * @param  {Object} idFilter    Identifier
   * @param  {Object} props Object with properties required to create a configuration
   * @param  {addConsumerFilterConfig_cb} cb Callback
   * @returns {void}
   */
  addConsumerFilterConfig: function(idConsumer, idFilter, props, cb) {
    // Check if a consumer-filter configuration exists.
    if (filterConsumerConfigurationsCollection.findOne({ "$and": [
      {idFilter: idFilter},
      {idConsumer: idConsumer}
    ]})) {
      return cb(new Errors.DuplicatedEntity());
    }
    // Check filter and consumer exists
    if (!filtersCollection.findOne({id: idFilter}) || !consumersCollection.findOne({id: idConsumer})) {
      return cb(new Errors.NoEntityFound());
    }

    // Add id's
    props.idFilter = idFilter;
    props.idConsumer = idConsumer;

    // Store filter
    try {
      var configdb = filterConsumerConfigurationsCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var config = {
      idFilter: configdb.idFilter,
      ifConsumer: configdb.idConsumer,
      config: configdb.config
    };

    return cb(null, config);
  },

  /**
   * updateConsumerFilterConfig Callback.
   * @callback updateConsumerFilterConfig_cb
   * @param {Error} err Error if filter or consumer does not exists or the
   * config does not exists.
   * @param {Object} configuration Configuration
   * @returns {void}
   */
  /**
   * Updates a filter-consumer configuration
   * @param  {Object} idConsumer    Identifier
   * @param  {Object} idFilter    Identifier
   * @param  {Object} props Object with properties to update a configuration
   * @param  {updateConsumerFilterConfig_cb} cb Callback
   * @returns {void}
   */
  updateConsumerFilterConfig: function(idConsumer, idFilter, props, cb) {
    // Check filter and consumer exists
    if (!filtersCollection.findOne({id: idFilter}) || !consumersCollection.findOne({id: idConsumer})) {
      return cb(new Errors.NoEntityFound());
    }
    // Check if cofig exists
    var configdb = filterConsumerConfigurationsCollection.findOne({ "$and": [
      {idFilter: idFilter},
      {idConsumer: idConsumer}
    ]});
    if (!configdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Add id's
    configdb.idFilter = idFilter;
    configdb.idConsumer = idConsumer;
    configdb.config = props.config;

    // Update filter
    try {
      configdb = filterConsumerConfigurationsCollection.update(configdb);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var config = {
      idFilter: configdb.idFilter,
      ifConsumer: configdb.idConsumer,
      config: configdb.config
    };

    return cb(null, config);
  },

  /**
   * deleteConsumerFilterConfig Callback.
   * @callback deleteConsumerFilterConfig_cb
   * @param {Error} err Error if the config does not exists.
   * @param {Object} configuration Configuration
   * @returns {void}
   */
  /**
   * Deletes a filter-consumer configuration
   * @param  {Object} idConsumer    Identifier
   * @param  {Object} idFilter    Identifier
   * @param  {deleteConsumerFilterConfig_cb} cb Callback
   * @returns {void}
   */
  deleteConsumerFilterConfig: function(idConsumer, idFilter, cb) {
    // Check if cofig exists
    var configdb = filterConsumerConfigurationsCollection.findOne({ "$and": [
      {idFilter: idFilter},
      {idConsumer: idConsumer}
    ]});
    if (!configdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Delete filter
    try {
      filterConsumerConfigurationsCollection.remove(configdb);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var config = {
      idFilter: configdb.idFilter,
      ifConsumer: configdb.idConsumer,
      config: configdb.config
    };

    return cb(null, config);
  },



  /**
   * Providers
   */

  /**
   * Callback for findProviders.
   * @callback findProviders_cb
   * @param {Error} err Error
   * @param {Array<Provider>} Array of Provider instances or empty if there is none.
   */
  /**
   * Get a list of Providers.
   * @param  {findProviders_cb} cb Callback
   * @returns {void}
   */
  findProviders: function(cb) {
    var providers = providersCollection.find();
    return cb(null, providers);
    // TODO - Cleanup providers before return
  },

  /**
   * getProviderById Callback.
   * @callback getProviderById_cb
   * @param {Error} err Error if entity does not exists.
   * @param {Provider} provider Provider instance.
   * @returns {void}
   */
  /**
   * Get the provider specified by the given id
   * @param  {Object} idProvider    Identifier
   * @param  {getProviderById_cb} cb Callback
   * @returns {void}
   */
  getProviderById: function(idProvider, cb) {
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      description: providerdb.description,
      target: providerdb.target,
      context: providerdb.context
    };

    return cb(null, provider);
  },

  /**
   * addProvider Callback.
   * @callback addProvider_cb
   * @param {Error} err Error if the specified context' is already
   * in use by another provider.
   * @param {Provider} provider Provider instance
   * @returns {void}
   */
  /**
   * Creates a new provider
   * @param  {Object} props Object with properties required to create a provider instance
   * @param  {addProvider_cb} cb Callback
   * @returns {void}
   */
  addProvider: function(props, cb) {
    // Check context is in use
    if (providersCollection.findOne({context: props.context})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Store provider
    try {
      var providerdb = providersCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      description: providerdb.description,
      target: providerdb.target,
      context: providerdb.context
    };

    return cb(null, provider);
  },

  /**
   * updateProvider Callback.
   * @callback updateProvider_cb
   * @param {Error} err Error if the provider does not exists or the specified
   * 'context' is already in use by another provider.
   * @param {Provider} provider Provider instance
   * @returns {void}
   */
  /**
   * Updates a provider
   * @param {Object}  idProvider  Identifier
   * @param  {Object} props Object with properties to be updated
   * @param  {updateProvider_cb} cb Callback
   * @returns {void}
   */
  updateProvider: function(idProvider, props, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check context is in use
    if (providersCollection.findOne({context: props.context})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Update properties
    providerdb.target = props.target || providerdb.target;
    providerdb.context = props.context || providerdb.context;
    providerdb.description = props.description || providerdb.description;

    // Update provider
    try {
      providerdb = providersCollection.update(providerdb);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      description: providerdb.description,
      target: providerdb.target,
      context: providerdb.context
    };

    return cb(null, provider);
  },

  /**
   * deleteProvider Callback.
   * @callback deleteProvider_cb
   * @param {Error} err Error if the provider does not exists.
   * @param {Provider} provider Provider instance
   * @returns {void}
   */
  /**
   * Deletes a provider
   * @param {Object}  idProvider  Identifier
   * @param  {deleteProvider_cb} cb Callback
   * @returns {void}
   */
  deleteProvider: function(idProvider, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Delete provider
    try {
      providersCollection.remove(providerdb);

      // Remove all the resources
      var providerResources = resourcesCollection.find({idProvider: idProvider});
      for (var i = 0; i < providerResources.length; i++) {
        resourcesCollection.remove(providerResources[i]);
      }
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      description: providerdb.description,
      target: providerdb.target,
      context: providerdb.context
    };

    return cb(null, provider);
  },



  /**
   * Resources
   */

  /**
   * Callback for findResources.
   * @callback findResources_cb
   * @param {Error} err Error if provider do not exists.
   * @param {Array<Resource>} Array of Resources instances or empty if there is none.
   */
  /**
   * Get a list of Resources.
   * @param {Object}  idProvider  Identifier
   * @param  {findResources_cb} cb Callback
   * @returns {void}
   */
  findResources: function(idProvider, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    var resources = resourcesCollection.find({idProvider: idProvider});
    return cb(null, resources);
    // TODO - Cleanup resources before return
  },

  /**
   * Callback for getResourceById.
   * @callback getResourceById_cb
   * @param {Error} err Error if provider or resource do not exists.
   * @param {Array<Resource>} Array of Resource instance.
   */
  /**
   * Get a Resource instance.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param  {getResourceById_cb} cb Callback
   * @returns {void}
   */
  getResourceById: function(idProvider, idResource, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Cleanup loki properties
    var resource = {
      id: resourcedb.id,
      path: resourcedb.path,
      description: resourcedb.descrition
    };

    return cb(null, resource);
  },

  /**
   * Callback for addResource.
   * @callback addResource_cb
   * @param {Error} err Error if provider do not exists.
   * @param {Array<Resource>} Array of Resource instance.
   */
  /**
   * Creates a Resource instance.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  props  Properties
   * @param  {addResource_cb} cb Callback
   * @returns {void}
   */
  addResource: function(idProvider, props, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check if path in in use by another resource of the provider
    if (props.path && resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {path: props.path}
    ]})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Store resource
    try {
      props.idProvider = idProvider;
      var resourcedb = resourcesCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var resource = {
      id: resourcedb.id,
      path: resourcedb.path,
      description: resourcedb.descrition
    };

    return cb(null, resource);
  },

  /**
   * Callback for updateResource.
   * @callback updateResource_cb
   * @param {Error} err Error if provider or resource do not exists.
   * @param {Array<Resource>} Array of Resource instance.
   */
  /**
   * Updates a Resource.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param {Object}  props  Properties
   * @param  {updateResource_cb} cb Callback
   * @returns {void}
   */
  updateResource: function(idProvider, idResource, props, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check resource exists and get reference
    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check if path in in use by another resource of the provider
    if (props.path && resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {path: props.path}
    ]})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Update properties
    resourcedb.path = props.path || resourcedb.path;
    resourcedb.description = props.description || resourcedb.description;

    try {
      resourcedb = resourcesCollection.update(resourcedb);
    } catch (err) {
      return cb(err);
    }


    // Cleanup loki properties
    var resource = {
      id: resourcedb.id,
      path: resourcedb.path,
      description: resourcedb.descrition
    };

    return cb(null, resource);
  },

  /**
   * Callback for deleteResourceById.
   * @callback deleteResourceById_cb
   * @param {Error} err Error if provider or resource do not exists.
   * @param {Object} props Properties of the deleted resource
   */
  /**
   * Get a Resource instance.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param  {deleteResourceById_cb} cb Callback
   * @returns {void}
   */
  deleteResource: function(idProvider, idResource, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Remove resource
    try {
      resourcesCollection.remove(resourcedb);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var resource = {
      path: resourcedb.path,
      description: resourcedb.descrition
    };

    return cb(null, resource);
  },

};


module.exports = Butler;
