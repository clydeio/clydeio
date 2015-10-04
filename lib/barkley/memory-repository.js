"use strict";

var Loki = require("lokijs");
var Errors = require("./errors");

// Internall memory database.
var db = new Loki("barkleyconfig.json");
// Configurations
var configurationsCollection = db.addCollection("configurations");
// Consumers
var consumersCollection = db.addCollection("consumers", {indices: ["id", "key"], unique: ["key"]});
// Providers
var providersCollection = db.addCollection("providers", {indices: ["id"], unique: ["context"]});
// Resources
var resourcesCollection = db.addCollection("resources", {indices: ["id", "idProvider"]});
// Filters
var filtersCollection = db.addCollection("filters", {indices: ["id"], unique: ["name"]});
// Relationship filter-consumer
var filterConsumerConfigurationsCollection = db.addCollection("filterconsumerconfiguration");
// Relationship configuration-filter
var configurationFilterCollection = db.addCollection("configurationfilter");
// Relationship configuration-provider
var configurationProviderCollection = db.addCollection("configurationprovider");
// Relationship provider-filter
var providerFilterCollection = db.addCollection("providerfilter");
// Relationship resource-filter
var resourceFilterCollection = db.addCollection("resourcefilter");

/**
 * @classdesc
 * Barkley in memory implementation. **Only suitable use for testing. Not ready for production**.
 *
 * You are free to provide your custom Barkley implementation while implements
 * the same set of methods. Long live to duck typing !!!.
 *
 * > NOTE: All operations expects well formed parameters. It is the caller's responsibility
 * > to ensure the parameters are right.
 *
 * @class
 */
var Barkley =
/** @lends Repository */
{

  // ////////////////////////////////////////
  // Consumers
  // ////////////////////////////////////////

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
  * Removes a consumer and all its related filter-consumer configurations.
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


  // ////////////////////////////////////////
  // Filters
  // ////////////////////////////////////////

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
    // Check filter exists
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
  * any consumer configurations or is attached to a configuration, provider or
  * resource.
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

    // Do not remove filter if it has consumer's configurations or is attached to any
    // configuration, provider or resource
    if (filterConsumerConfigurationsCollection.findOne({idFilter: idFilter}) ||
      configurationFilterCollection.findOne({idFilter: idFilter}) ||
      providerFilterCollection.findOne({idFilter: idFilter}) ||
      resourceFilterCollection.findOne({idFilter: idFilter})) {
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


  // ////////////////////////////////////////
  // Filter-Consumer configurations
  // ////////////////////////////////////////

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
    // Check if config exists
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



  // ////////////////////////////////////////
  // Providers
  // ////////////////////////////////////////

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
   * @param {Error} err Error if the provider does not exists or it is in use
   * by a configuration.
   * @param {Provider} provider Provider instance
   * @returns {void}
   */
  /**
   * Deletes a provider. The operation removes any relationship with filters and
   * cascade deletes its own resources.
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

    // Do not remove provider if it is used in a configuration.
    if (configurationProviderCollection.findOne({idProvider: idProvider})) {
      return cb(new Errors.EntityWithRelations());
    }

    // Delete provider
    try {
      providersCollection.remove(providerdb);

      // Remove all the resources
      var providerResources = resourcesCollection.find({idProvider: idProvider});
      for (var i = 0; i < providerResources.length; i++) {
        // Invoke deleteResource to remove in cascade the resource and filters
        this.deleteResource(idProvider, providerResources[i].idResource);
      }

      // Remove all attached filters
      var providerFilters = providerFilterCollection.find({idProvider: idProvider});
      for (var j = 0; j < providerFilters.length; j++) {
        providerFilterCollection.remove(providerFilters[j]);
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



  // ////////////////////////////////////////
  // Provider Resources
  // ////////////////////////////////////////

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
   * Delete a Resource instance. The operation removes any relationship with filters.
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

    // Check if provider has the resource
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

      // Remove all attached filters
      var resourceFilters = resourceFilterCollection.find({idResource: idResource});
      for (var j = 0; j < resourceFilters.length; j++) {
        resourceFilterCollection.remove(resourceFilters[j]);
      }
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


  // ////////////////////////////////////////
  // Provider Filters
  // ////////////////////////////////////////

  /**
   * Callback for findProviderFilters.
   * @callback findProviderFilters_cb
   * @param {Error} err Error if provider do not exists.
   * @param {Array<Filter>} Array of Filters instances or empty if there is none.
   */
  /**
   * Get a list of Filters.
   * @param {Object}  idProvider  Identifier
   * @param {String}  type  Filter type (prefilter|postfilter)
   * @param  {findProviderFilters_cb} cb Callback
   * @returns {void}
   */
  findProviderFilters: function(idProvider, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get provider's filters IDs
    var filtersIds = providerFilterCollection.find({"$and": [
      {idProvider: idProvider},
      {type: type}
    ]}).map(function(item) {
      return item.idFilter;
    });

    // Get provider's filters
    var filters = filtersCollection.find({id: {"$containsAny": filtersIds}});

    return cb(null, filters);
    // TODO - Cleanup resources before return
  },

  /**
   * Callback for getProviderFilterById.
   * @callback getProviderFilterById_cb
   * @param {Error} err Error if provider does not exist or the provider does
   * not have the specified filter.
   * @param {Filter} Filter instance.
   */
  /**
   * Get a Provider's filter.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {getProviderFilterById_cb} cb Callback
   * @returns {void}
   */
  getProviderFilterById: function(idProvider, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get provider's filter ID
    var providersfilter = providerFilterCollection.findOne({"$and": [
      {idProvider: idProvider},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!providersfilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get provider's filters
    var filterdb = filtersCollection.findOne({id: providersfilter.idFilter});

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
   * Callback for attachProviderFilter.
   * @callback attachProviderFilter_cb
   * @param {Error} err Error if provider or the filter does not exist or the
   * filter is already attached to the provider.
   * @param {Filter} Filter instance.
   */
  /**
   * Attach a filter to the Provider.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {attachProviderFilter_cb} cb Callback
   * @returns {void}
   */
  attachProviderFilter: function(idProvider, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter exists
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is not already attached to the provider
    var providersfilter = providerFilterCollection.findOne({"$and": [
      {idProvider: idProvider},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (providersfilter) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Attach filter to provider
    try {
      providerFilterCollection.insert({idProvider: idProvider, idFilter: idFilter, type: type});
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
   * Callback for detachProviderFilter.
   * @callback detachProviderFilter_cb
   * @param {Error} err Error if provider does not exist or the
   * filter is not attached to the provider.
   * @param {Filter} Filter instance.
   */
  /**
   * Dettach a filter from the Provider.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {detachProviderFilter_cb} cb Callback
   * @returns {void}
   */
  detachProviderFilter: function(idProvider, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is attached to the provider
    var providersfilter = providerFilterCollection.findOne({"$and": [
      {idProvider: idProvider},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!providersfilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get filter
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Dettach filter to provider
    try {
      providerFilterCollection.remove(providersfilter);
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


  // ////////////////////////////////////////
  // Provider Resource Filters
  // ////////////////////////////////////////

  /**
   * Callback for findResourceFilters.
   * @callback findResourceFilters_cb
   * @param {Error} err Error if provider do not exists.
   * @param {Array<Filter>} Array of Filters instances or empty if there is none.
   */
  /**
   * Get a list of Filters.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param {String}  type  Filter type (prefilter|postfilter)
   * @param  {findResourceFilters_cb} cb Callback
   * @returns {void}
   */
  findResourceFilters: function(idProvider, idResource, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // TODO - Check resource belongs to provider

    // Check resource exists
    var resourcedb = resourcesCollection.findOne({id: idResource});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get resource's filters IDs
    var filtersIds = resourceFilterCollection.find({"$and": [
      {idResource: idResource},
      {type: type}
    ]}).map(function(item) {
      return item.idFilter;
    });

    // Get provider's filters
    var filters = filtersCollection.find({id: {"$containsAny": filtersIds}});

    return cb(null, filters);
    // TODO - Cleanup resources before return
  },

  /**
   * Callback for getResourceFilterById.
   * @callback getResourceFilterById_cb
   * @param {Error} err Error if provider does not exist or the provider does
   * not have the specified filter.
   * @param {Filter} Filter instance.
   */
  /**
   * Get a Provider's filter.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {getResourceFilterById_cb} cb Callback
   * @returns {void}
   */
  getResourceFilterById: function(idProvider, idResource, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check resource exists and belongs to provider
    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter belongs to resource and get resource filter ID
    var resourcefilter = resourceFilterCollection.findOne({"$and": [
      {idResource: idResource},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!resourcefilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get provider's filter
    var filterdb = filtersCollection.findOne({id: resourcefilter.idFilter});

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
   * Callback for attachResourceFilter.
   * @callback attachResourceFilter_cb
   * @param {Error} err Error if provider or the filter does not exist or the
   * filter is already attached to the provider.
   * @param {Filter} Filter instance.
   */
  /**
   * Attach a filter to the Provider.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {attachResourceFilter_cb} cb Callback
   * @returns {void}
   */
  attachResourceFilter: function(idProvider, idResource, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check resource exists and belongs to provider
    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter exists
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is not already attached to the resource
    var resourcefilter = resourceFilterCollection.findOne({"$and": [
      {idResource: idResource},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (resourcefilter) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Attach filter to provider
    try {
      resourceFilterCollection.insert({idResource: idResource, idFilter: idFilter, type: type});
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
   * Callback for detachResourceFilter.
   * @callback detachResourceFilter_cb
   * @param {Error} err Error if provider does not exist or the
   * filter is not attached to the provider.
   * @param {Filter} Filter instance.
   */
  /**
   * Dettach a filter from the Provider.
   * @param {Object}  idProvider  Identifier
   * @param {Object}  idResource  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {detachResourceFilter_cb} cb Callback
   * @returns {void}
   */
  detachResourceFilter: function(idProvider, idResource, idFilter, type, cb) {
    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check resource exists and belongs to provider
    var resourcedb = resourcesCollection.findOne({ "$and": [
      {idProvider: idProvider},
      {id: idResource}
    ]});
    if (!resourcedb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is attached to the resource
    var resourcefilter = resourceFilterCollection.findOne({"$and": [
      {idResource: idResource},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!resourcefilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get filter
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Dettach filter to provider
    try {
      resourceFilterCollection.remove(resourcefilter);
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


  // ////////////////////////////////////////
  // Configurations
  // ////////////////////////////////////////

  /**
   * Callback for findConfigurations.
   * @callback findConfigurations_cb
   * @param {Error} err Error
   * @param {Array<Configurations>} Array of Configurations instances or empty if there is none.
   */
  /**
   * Get a list of Configurations.
   * @param  {findConfigurations_cb} cb Callback
   * @returns {void}
   */
  findConfigurations: function(cb) {
    var configurations = configurationsCollection.find();
    return cb(null, configurations);
    // TODO - Cleanup providers before return
  },


  /**
   * getConfigurationById Callback.
   * @callback getConfigurationById_cb
   * @param {Error} err Error if entity does not exists.
   * @param {Configuration} configuration Configuration instance or null if not found.
   * @returns {void}
   */
  /**
   * Get the configuration specified by the given id
   * @param  {Object} idConfiguration    Identifier
   * @param  {getConfigurationById_cb} cb Callback
   * @returns {void}
   */
  getConfigurationById: function(idConfiguration, cb) {
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Cleanup loki properties
    var configuration = {
      name: configurationdb.name,
      description: configurationdb.description
    };

    return cb(null, configuration);
  },

  /**
   * addConfiguration Callback.
   * @callback addConfiguration_cb
   * @param {Error} err Error if the specified 'name' value already is used by another configuration.
   * @param {Configuration} configuration Configuration instance
   * @returns {void}
   */
  /**
   * Creates a new configuration
   * @param  {Object} props Object with properties required to create a configuration instance
   * @param  {addConfiguration_cb} cb Callback
   * @returns {void}
   */
  addConfiguration: function(props, cb) {
    // Check name exists
    if (configurationsCollection.findOne({name: props.name})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Store configuration
    try {
      var configurationdb = configurationsCollection.insert(props);
    } catch (err) {
      return cb(err);
    }

    // Cleanup loki properties
    var configuration = {
      id: configurationdb.id,
      name: configurationdb.name,
      description: configurationdb.description
    };

    return cb(null, configuration);
  },

  /**
   * updateConfiguration Callback.
   * @callback updateConfiguration_cb
   * @param {Error} err Error if the specified configuration ID does not exists or
   * the specified 'name' value already is used by another configuration.
   * @param {Configuration} configuration Configuration instance or null if not found.
   * @returns {void}
   */
  /**
   * Saves (updates) a configuration within the configuration.
   * @param {Object} idConfiguration Configuration identifier
   * @param  {Object} props Configuration
   * @param  {updateConfiguration_cb} cb Callback
   * @returns {void}
   */
  updateConfiguration: function(idConfiguration, props, cb) {
    // Check if configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }
    // Check name exists
    // NOTE: Probably is better let loky to check this applying a ensureUnique constrain
    if (configurationsCollection.findOne({name: props.name})) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Update properties
    configurationdb.name = props.name || configurationdb.name;
    configurationdb.description = props.description || configurationdb.description;

    // Update configuration
    try {
      configurationdb = configurationsCollection.update(configurationdb);
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var configuration = {
      id: configurationdb.id,
      name: configurationdb.name,
      description: configurationdb.description
    };

    return cb(null, configuration);
  },

  /**
  * deleteConfiguration Callback.
  * @callback deleteConfiguration_cb
  * @param {Error} err Error if entity does not exists
  * @param {Object} configuration Properties of the removed configuration
  * @returns {void}
  */
  /**
  * Removes a configuration. Note the operation does not removes any related
  * provider nor filter.
  * @param  {Object} idConfiguration Configuration identifier
  * @param  {deleteConfiguration_cb} cb Callback
  * @returns {void}
  */
  deleteConfiguration: function(idConfiguration, cb) {
    // Check if configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Delete configuration and its configurations
    try {
      configurationsCollection.remove(configurationdb);

      // Remove relations with filters.
      var filtersConfiguration = configurationFilterCollection.find({idConfiguration: idConfiguration});
      for (var i = 0; i < filtersConfiguration.length; i++) {
        configurationFilterCollection.remove(filtersConfiguration[i].idFilter);
      }

      // Remove relations to providers
      var providersConfiguration = configurationProviderCollection.find({idConfiguration: idConfiguration});
      for (var j = 0; j < providersConfiguration.length; j++) {
        configurationProviderCollection.remove(providersConfiguration[j].idProvider);
      }

    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var configuration = {
      name: configurationdb.name,
      description: configurationdb.description
    };

    return cb(null, configuration);
  },


  // ////////////////////////////////////////
  // Configuration Filters
  // ////////////////////////////////////////

  /**
   * Callback for findConfigurationFilters.
   * @callback findConfigurationFilters_cb
   * @param {Error} err Error if configuration do not exists.
   * @param {Array<Filter>} Array of Filters instances or empty if there is none.
   */
  /**
   * Get a list of Filters.
   * @param {Object}  idConfiguration  Identifier
   * @param {String}  type  Filter type (prefilter|postfilter)
   * @param  {findConfigurationFilters_cb} cb Callback
   * @returns {void}
   */
  findConfigurationFilters: function(idConfiguration, type, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's filters IDs
    var filtersIds = configurationFilterCollection.find({"$and": [
      {idConfiguration: idConfiguration},
      {type: type}
    ]}).map(function(item) {
      return item.idFilter;
    });

    // Get configuration's filters
    var filters = filtersCollection.find({id: {"$containsAny": filtersIds}});

    return cb(null, filters);
    // TODO - Cleanup resources before return
  },

  /**
   * Callback for getConfigurationFilterById.
   * @callback getConfigurationFilterById_cb
   * @param {Error} err Error if configuration does not exist or the configuration does
   * not have the specified filter.
   * @param {Filter} Filter instance.
   */
  /**
   * Get a Configuration's filter.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {getConfigurationFilterById_cb} cb Callback
   * @returns {void}
   */
  getConfigurationFilterById: function(idConfiguration, idFilter, type, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's filter ID
    var configurationsfilter = configurationFilterCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!configurationsfilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's filters
    var filterdb = filtersCollection.findOne({id: configurationsfilter.idFilter});

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
   * Callback for attachConfigurationFilter.
   * @callback attachConfigurationFilter_cb
   * @param {Error} err Error if configuration or the filter does not exist or the
   * filter is already attached to the configuration.
   * @param {Filter} Filter instance.
   */
  /**
   * Attach a filter to the Configuration.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {attachConfigurationFilter_cb} cb Callback
   * @returns {void}
   */
  attachConfigurationFilter: function(idConfiguration, idFilter, type, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter exists
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is not already attached to the configuration
    var configurationsfilter = configurationFilterCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (configurationsfilter) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Attach filter to configuration
    try {
      configurationFilterCollection.insert({idConfiguration: idConfiguration, idFilter: idFilter, type: type});
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
   * Callback for detachConfigurationFilter.
   * @callback detachConfigurationFilter_cb
   * @param {Error} err Error if configuration does not exist or the
   * filter is not attached to the configuration.
   * @param {Filter} Filter instance.
   */
  /**
   * Dettach a filter from the Configuration.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idFilter  Identifier
   * @param {String}  type  Filter's type
   * @param  {detachConfigurationFilter_cb} cb Callback
   * @returns {void}
   */
  detachConfigurationFilter: function(idConfiguration, idFilter, type, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check filter is attached to the configuration
    var configurationsfilter = configurationFilterCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {"$and": [
        {idFilter: idFilter},
        {type: type}
      ]}
    ]});
    if (!configurationsfilter) {
      return cb(new Errors.NoEntityFound());
    }

    // Get filter
    var filterdb = filtersCollection.findOne({id: idFilter});
    if (!filterdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Dettach filter to configuration
    try {
      configurationFilterCollection.remove(configurationsfilter);
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


  // ////////////////////////////////////////
  // Configuration Providers
  // ////////////////////////////////////////

  /**
   * Callback for findConfigurationProviders.
   * @callback findConfigurationProviders_cb
   * @param {Error} err Error if configuration do not exists.
   * @param {Array<Provider>} Array of Providers instances or empty if there is none.
   */
  /**
   * Get a list of Providers.
   * @param {Object}  idConfiguration  Identifier
   * @param  {findConfigurationProviders_cb} cb Callback
   * @returns {void}
   */
  findConfigurationProviders: function(idConfiguration, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's providers IDs
    var providersIds = configurationProviderCollection.find({idConfiguration: idConfiguration}).map(function(item) {
      return item.idProvider;
    });

    // Get configuration's providers
    var providers = providersCollection.find({id: {"$containsAny": providersIds}});

    return cb(null, providers);
    // TODO - Cleanup resources before return
  },

  /**
   * Callback for getConfigurationProviderById.
   * @callback getConfigurationProviderById_cb
   * @param {Error} err Error if configuration does not exist or the configuration does
   * not have the specified provider.
   * @param {Provider} Provider instance.
   */
  /**
   * Get a Configuration's provider.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idProvider  Identifier
   * @param  {getConfigurationProviderById_cb} cb Callback
   * @returns {void}
   */
  getConfigurationProviderById: function(idConfiguration, idProvider, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's provider ID
    var configurationsprovider = configurationProviderCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {idProvider: idProvider}
    ]});
    if (!configurationsprovider) {
      return cb(new Errors.NoEntityFound());
    }

    // Get configuration's providers
    var providerdb = providersCollection.findOne({id: configurationsprovider.idProvider});

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      name: providerdb.name,
      description: providerdb.description
    };

    return cb(null, provider);
  },

  /**
   * Callback for attachConfigurationProvider.
   * @callback attachConfigurationProvider_cb
   * @param {Error} err Error if configuration or the provider does not exist or the
   * provider is already attached to the configuration.
   * @param {Provider} Provider instance.
   */
  /**
   * Attach a provider to the Configuration.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idProvider  Identifier
   * @param  {attachConfigurationProvider_cb} cb Callback
   * @returns {void}
   */
  attachConfigurationProvider: function(idConfiguration, idProvider, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check provider exists
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check provider is not already attached to the configuration
    var configurationsprovider = configurationProviderCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {idProvider: idProvider}
    ]});
    if (configurationsprovider) {
      return cb(new Errors.DuplicatedEntity());
    }

    // Attach provider to configuration
    try {
      configurationProviderCollection.insert({idConfiguration: idConfiguration, idProvider: idProvider});
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      name: providerdb.name,
      description: providerdb.description
    };

    return cb(null, provider);
  },

  /**
   * Callback for detachConfigurationProvider.
   * @callback detachConfigurationProvider_cb
   * @param {Error} err Error if configuration does not exist or the
   * provider is not attached to the configuration.
   * @param {Provider} Provider instance.
   */
  /**
   * Dettach a provider from the Configuration.
   * @param {Object}  idConfiguration  Identifier
   * @param {Object}  idProvider  Identifier
   * @param  {detachConfigurationProvider_cb} cb Callback
   * @returns {void}
   */
  detachConfigurationProvider: function(idConfiguration, idProvider, cb) {
    // Check configuration exists
    var configurationdb = configurationsCollection.findOne({id: idConfiguration});
    if (!configurationdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Check provider is attached to the configuration
    var configurationsprovider = configurationProviderCollection.findOne({"$and": [
      {idConfiguration: idConfiguration},
      {idProvider: idProvider}
    ]});
    if (!configurationsprovider) {
      return cb(new Errors.NoEntityFound());
    }

    // Get provider
    var providerdb = providersCollection.findOne({id: idProvider});
    if (!providerdb) {
      return cb(new Errors.NoEntityFound());
    }

    // Dettach provider to configuration
    try {
      configurationProviderCollection.remove(configurationsprovider);
    } catch(err) {
      return cb(err);
    }

    // Cleanup loki properties
    var provider = {
      id: providerdb.id,
      name: providerdb.name,
      description: providerdb.description
    };

    return cb(null, provider);
  }

};


module.exports = Barkley;
