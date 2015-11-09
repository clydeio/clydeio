"use strict";

var express = require("express");
var HttpError = require("node-http-error");
var validator = require("validator");
var uuid = require("node-uuid");
var util = require("util");
var Errors = require("./errors");


/* eslint-disable new-cap */
var router = express.Router(),
    configurationsRoutes = express.Router(),
    providersRoutes = express.Router(),
    filtersRoutes = express.Router(),
    consumersRoutes = express.Router();
/* eslint-enable new-cap */

// Global variable reference to barkley backend implementation
var barkley = null;

//
// Messages
//

var NO_ENTITY_ID_FOUND_MSG = "No entity found with ID='%s'.";
var NO_CONFIG_FOUND_MSG = "No configuration found for FILTER_ID='%s' and CONSUMER_ID='%s'.";
var NO_RESOURCE_FOUND_MSG = "No resource found for PROVIDER_ID='%s' and RESOURCE_ID='%s'.";
var NO_FILTER_PROVIDER_FOUND_MSG = "No filter found for PROVIDER_ID='%s' and FILTER_ID='%s'.";
var NO_FILTER_RESOURCE_FOUND_MSG = "No filter found for RESOURCE_ID='%s' and FILTER_ID='%s'.";
var NO_FILTER_CONFIGURATION_FOUND_MSG = "No filter found for CONFIGURATION_ID='%s' and FILTER_ID='%s'.";
var NO_PROVIDER_CONFIGURATION_FOUND_MSG = "No provider found for CONFIGURATION_ID='%s' and PROVIDER_ID='%s'.";

var INVALID_KEY_MSG = "'key' must contains only ASCII characters and have at least 12 characters length.";
var INVALID_SECRET_MSG = "'secret' must contains only ASCII characters and have at least 32 characters length.";
var INVALID_MODULE_MSG = "'module' must contains only ASCII characters.";
var INVALID_NAME_MSG = "'name' must contains only ASCII characters.";
var INVALID_DESCRIPTION_MSG = "'description' must contains only ASCII characters.";
var INVALID_CONFIG_MSG = "'config' must be a valid object.";
var INVALID_TARGET_MSG = "'target' must be a valid URL.";
var INVALID_CONTEXT_MSG = "'context' must be a valid path";
var INVALID_PATH_MSG = "'path' must be a valid path";

var DUPLICATED_CONTEXT_MSG = "There is another entity with the same 'context' value.";
var DUPLICATED_NAME_MSG = "There is another entity with the same 'name' value.";
var DUPLICATED_KEY_MSG = "There is another entity with the same 'key' value.";
var DUPLICATED_PATH_MSG = "There is another entity with the same 'path' value.";
var DUPLICATED_PROVIDER_FILTER_MSG = "Filter is already attached to the provider.";
var DUPLICATED_RESOURCE_FILTER_MSG = "Filter is already attached to the resource.";
var DUPLICATED_CONFIGURATION_FILTER_MSG = "Filter is already attached to the configuration.";

var ENTITY_WITH_RELATION_MSG = "Entity is in use by a relationship with another entity. Remove relationship first.";


// ////////////////////////////////////////
// Consumers
// ////////////////////////////////////////

function listConsumers(req, res, next) {
  barkley.findConsumers(function(err, consumers) {
    if (err) {
      next(err);
    }
    res.json(consumers);
  });
}

function getConsumer(req, res, next) {
  var idConsumer = req.params.idConsumer;
  // Find consumer by id
  barkley.getConsumerById(idConsumer, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConsumer)));
      }
      return next(err);
    }
    res.json(consumer);
  });
}

function addConsumer(req, res, next) {
  var props = req.body;
  // Check props are valid for creation
  // - props.key is a String
  // - props.secret is a String
  if (!validator.isAscii(props.key) || !validator.isLength(props.key, 12)) {
    return next(new HttpError(400, INVALID_KEY_MSG));
  }
  if (!validator.isAscii(props.secret) || !validator.isLength(props.secret, 32)) {
    return next(new HttpError(400, INVALID_SECRET_MSG));
  }

  // Generate a UUID
  props.id = uuid.v4();

  // Add consumer to repository
  barkley.addConsumer(props, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_KEY_MSG));
      }
      return next(err);
    }
    res.json(consumer);
  });
}

function updateConsumer(req, res, next) {
  var idConsumer = req.params.idConsumer;
  var props = req.body;
  // Check props are valid for update
  // - at least one property is present
  // - if present props.key is a String
  // - if present props.secret is a String
  if (!props.key && !props.secret) {
    return next(new HttpError(400));
  }
  if (props.key && (!validator.isAscii(props.key) || !validator.isLength(props.key, 12))) {
    return next(new HttpError(400, INVALID_KEY_MSG));
  }
  if (props.secret && (!validator.isAscii(props.secret) || !validator.isLength(props.secret, 32))) {
    return next(new HttpError(400, INVALID_SECRET_MSG));
  }

  // Update consumer
  barkley.updateConsumer(idConsumer, props, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConsumer)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_KEY_MSG));
      }
      return next(err);
    }
    res.json(consumer);
  });
}

function deleteConsumer(req, res, next) {
  var idConsumer = req.params.idConsumer;
  // Delete consumer
  barkley.deleteConsumer(idConsumer, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConsumer)));
      }
      return next(err);
    }
    res.json(consumer);
  });
}


// ////////////////////////////////////////
// Filters
// ////////////////////////////////////////

function listFilters(req, res, next) {
  barkley.findFilters(function(err, filters) {
    if (err) {
      next(err);
    }
    res.json(filters);
  });
}

function getFilter(req, res, next) {
  var idFilter = req.params.idFilter;
  // Find filter by id
  barkley.getFilterById(idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idFilter)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function addFilter(req, res, next) {
  var props = req.body;
  // Check props are valid for creation
  // - props.module is a String
  // - props.name is a String
  // - if present props.description is a String
  // - if present props.config is an object
  if (!validator.isAscii(props.module)) {
    return next(new HttpError(400, INVALID_MODULE_MSG));
  }
  if (!validator.isAscii(props.name)) {
    return next(new HttpError(400, INVALID_NAME_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }
  if (props.config && typeof props.config !== "object") {
    return next(new HttpError(400, INVALID_CONFIG_MSG));
  }

  // Generate a UUID
  props.id = uuid.v4();

  // Add filter to repository
  barkley.addFilter(props, function(err, filter) {
    if (err) {
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_NAME_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function updateFilter(req, res, next) {
  var idFilter = req.params.idFilter;
  var props = req.body;
  // Check props are valid for update
  // - at least one property is present
  // - if present props.module is a String
  // - if present props.name is a String
  // - if present props.description is a String
  // - if present props.config is an object
  if (!props.module && !props.name && !props.description && !props.config) {
    return next(new HttpError(400));
  }
  if (props.module && !validator.isAscii(props.module)) {
    return next(new HttpError(400, INVALID_MODULE_MSG));
  }
  if (props.name && !validator.isAscii(props.name)) {
    return next(new HttpError(400, INVALID_NAME_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }
  if (props.config && typeof props.config !== "object") {
    return next(new HttpError(400, INVALID_CONFIG_MSG));
  }

  // Update filter
  barkley.updateFilter(idFilter, props, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idFilter)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_NAME_MSG));
      }
      return next(err);
    }
    res.json(consumer);
  });
}

function deleteFilter(req, res, next) {
  var idFilter = req.params.idFilter;
  // Delete filter
  barkley.deleteFilter(idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idFilter)));
      }
      if (err instanceof Errors.EntityWithRelations) {
        return next(new HttpError(409, ENTITY_WITH_RELATION_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}


// ////////////////////////////////////////
// Filter-Consumer config
// ////////////////////////////////////////

function listFilterConsumerConfigs(req, res, next) {
  var idFilter = req.params.idFilter;
  barkley.findFilterConsumerConfigsByFilter(idFilter, function(err, configs) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idFilter)));
      }
      next(err);
    }
    res.json(configs);
  });
}

function listConsumerFilterConfigs(req, res, next) {
  var idConsumer = req.params.idConsumer;
  barkley.findConsumerFilterConfigsByConsumer(idConsumer, function(err, configs) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConsumer)));
      }
      next(err);
    }
    res.json(configs);
  });
}

function getConsumerFilterConfig(req, res, next) {
  var idConsumer = req.params.idConsumer;
  var idFilter = req.params.idFilter;
  // Find filter-consumer by ids
  barkley.getConsumerFilterConfigByFilterAndConsumer(idConsumer, idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONFIG_FOUND_MSG, idFilter, idConsumer)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function addConsumerFilterConfig(req, res, next) {
  var idFilter = req.params.idFilter;
  var idConsumer = req.params.idConsumer;
  var props = req.body;
  // Check props are valid for creation
  // - props.config is an object
  if (typeof props.config !== "object") {
    return next(new HttpError(400, INVALID_CONFIG_MSG));
  }

  // Add filter-consumer configuration to repository
  barkley.addConsumerFilterConfig(idConsumer, idFilter, props, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONFIG_FOUND_MSG, idFilter, idConsumer)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_NAME_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function updateConsumerFilterConfig(req, res, next) {
  var idFilter = req.params.idFilter;
  var idConsumer = req.params.idConsumer;
  var props = req.body;
  // Check props are valid for creation
  // - props.config is an object
  if (typeof props.config !== "object") {
    return next(new HttpError(400, INVALID_CONFIG_MSG));
  }

  // Update filter-consumer configuration to repository
  barkley.updateConsumerFilterConfig(idConsumer, idFilter, props, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONFIG_FOUND_MSG, idFilter, idConsumer)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function deleteConsumerFilterConfig(req, res, next) {
  var idFilter = req.params.idFilter;
  var idConsumer = req.params.idConsumer;

  // Delete filter-consumer configuration from repository
  barkley.deleteConsumerFilterConfig(idConsumer, idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONFIG_FOUND_MSG, idFilter, idConsumer)));
      }
      return next(err);
    }
    res.json(filter);
  });
}


// ////////////////////////////////////////
// Providers
// ////////////////////////////////////////

function listProviders(req, res, next) {
  barkley.findProviders(function(err, providers) {
    if (err) {
      return next(err);
    }
    res.json(providers);
  });
}

function getProvider(req, res, next) {
  var idProvider = req.params.idProvider;
  // Find provider by id
  barkley.getProviderById(idProvider, function(err, provider) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      return next(err);
    }
    res.json(provider);
  });
}

function addProvider(req, res, next) {
  var props = req.body;

  // Check properties are valid
  // - props.target must be an URL
  // - props.context must be a valid path // TODO - to improve
  // - if present props.description must be a valid string
  if (!validator.isURL(props.target)) {
    return next(new HttpError(400, INVALID_TARGET_MSG));
  }
  if (!validator.isAscii(props.context)) {
    return next(new HttpError(400, INVALID_CONTEXT_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Generate a UUID
  props.id = uuid.v4();

  // Store provider
  barkley.addProvider(props, function(err, provider) {
    if (err) {
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_CONTEXT_MSG));
      }
      return next(err);
    }
    res.json(provider);
  });
}

function updateProvider(req, res, next) {
  var idProvider = req.params.idProvider;
  var props = req.body;

  // Check properties are valid
  // - if present props.target must be an URL
  // - if present props.context must be a valid path // TODO - to improve
  // - if present props.description must be a valid string
  if (props.target && !validator.isURL(props.target)) {
    return next(new HttpError(400, INVALID_TARGET_MSG));
  }
  if (props.context && !validator.isAscii(props.context)) {
    return next(new HttpError(400, INVALID_CONTEXT_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Store provider
  barkley.updateProvider(idProvider, props, function(err, provider) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_CONTEXT_MSG));
      }
      return next(err);
    }
    res.json(provider);
  });
}

function deleteProvider(req, res, next) {
  var idProvider = req.params.idProvider;

  // Delete provider
  barkley.deleteProvider(idProvider, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      if (err instanceof Errors.EntityWithRelations) {
        return next(new HttpError(409, ENTITY_WITH_RELATION_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}


// ////////////////////////////////////////
// Provider Resources
// ////////////////////////////////////////

function listProviderResources(req, res, next) {
  var idProvider = req.params.idProvider;
  barkley.findResources(idProvider, function(err, resources) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      return next(err);
    }
    res.json(resources);
  });
}

function getProviderResource(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  // Get resource
  barkley.getResourceById(idProvider, idResource, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_RESOURCE_FOUND_MSG, idProvider, idResource)));
      }
      return next(err);
    }
    res.json(resource);
  });
}

function addProviderResource(req, res, next) {
  var idProvider = req.params.idProvider;
  var props = req.body;

  // Check properties are valid:
  // - props.path is a valid path
  // - if exists props.descriptions is a string
  if (!validator.isAscii(props.path)) {
    return next(new HttpError(400, INVALID_PATH_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Create ID
  props.id = uuid.v4();

  // Add resource
  barkley.addResource(idProvider, props, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_PATH_MSG));
      }
      return next(err);
    }
    res.json(resource);
  });
}

function updateProviderResource(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  var props = req.body;

  // Check properties are valid:
  // - if exists props.path is a valid path
  // - if exists props.descriptions is a string
  if (!props.path && !props.description) {
    return next(new HttpError(400));
  }
  if (props.path && !validator.isAscii(props.path)) {
    return next(new HttpError(400, INVALID_PATH_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Update resource
  barkley.updateResource(idProvider, idResource, props, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_RESOURCE_FOUND_MSG, idProvider, idResource)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_PATH_MSG));
      }
      return next(err);
    }
    res.json(resource);
  });
}

function deleteProviderResource(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;

  // Delete resource
  barkley.deleteResource(idProvider, idResource, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_RESOURCE_FOUND_MSG, idProvider, idResource)));
      }
      return next(err);
    }
    res.json(resource);
  });
}


// ////////////////////////////////////////
// Provider Filters
// ////////////////////////////////////////

function listProviderFilters(req, res, next) {
  var idProvider = req.params.idProvider;
  var type = req.params.type;
  // List filters
  barkley.findProviderFilters(idProvider, type, function(err, filters) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      return next(err);
    }
    res.json(filters);
  });
}

function getProviderFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Get resource
  barkley.getProviderFilterById(idProvider, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_PROVIDER_FOUND_MSG, idProvider, idFilter)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function attachProviderFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Add filter
  barkley.attachProviderFilter(idProvider, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_PROVIDER_FOUND_MSG, idProvider, idFilter)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_PROVIDER_FILTER_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function detachProviderFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Delete resource
  barkley.detachProviderFilter(idProvider, idFilter, type, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_PROVIDER_FOUND_MSG, idProvider, idFilter)));
      }
      return next(err);
    }
    res.json(resource);
  });
}


// ////////////////////////////////////////
// Provider Resource's Filters
// ////////////////////////////////////////

function listResourceFilters(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  var type = req.params.type;
  // List filters
  barkley.findResourceFilters(idProvider, idResource, type, function(err, filters) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idProvider)));
      }
      return next(err);
    }
    res.json(filters);
  });
}

function getResourceFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Get resource
  barkley.getResourceFilterById(idProvider, idResource, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_RESOURCE_FOUND_MSG, idProvider, idFilter)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function attachResourceFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Add filter
  barkley.attachResourceFilter(idProvider, idResource, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_RESOURCE_FOUND_MSG, idProvider, idFilter)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_RESOURCE_FILTER_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function detachResourceFilter(req, res, next) {
  var idProvider = req.params.idProvider;
  var idResource = req.params.idResource;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Delete resource
  barkley.detachResourceFilter(idProvider, idResource, idFilter, type, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_RESOURCE_FOUND_MSG, idProvider, idFilter)));
      }
      return next(err);
    }
    res.json(resource);
  });
}


// ////////////////////////////////////////
// Configurations
// ////////////////////////////////////////
function listConfigurations(req, res, next) {
  // List configurations
  barkley.findConfigurations(function(err, configurations) {
    if (err) {
      return next(err);
    }
    res.json(configurations);
  });
}

function getConfiguration(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  // Find configuration by id
  barkley.getConfigurationById(idConfiguration, function(err, configuration) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConfiguration)));
      }
      return next(err);
    }
    res.json(configuration);
  });
}

function addConfiguration(req, res, next) {
  var props = req.body;
  // Check props are valid for creation
  // - props.name is a String
  // - if present props.description is a String
  if (!validator.isAscii(props.name)) {
    return next(new HttpError(400, INVALID_NAME_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Generate a UUID
  props.id = uuid.v4();

  // Add configuration to repository
  barkley.addConfiguration(props, function(err, configuration) {
    if (err) {
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_NAME_MSG));
      }
      return next(err);
    }
    res.json(configuration);
  });
}

function updateConfiguration(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var props = req.body;
  // Check props are valid for update
  // - at least one property is present
  // - if present props.name is a String
  // - if present props.description is a String
  if (!props.name && !props.description) {
    return next(new HttpError(400));
  }
  if (props.name && !validator.isAscii(props.name)) {
    return next(new HttpError(400, INVALID_NAME_MSG));
  }
  if (props.description && !validator.isAscii(props.description)) {
    return next(new HttpError(400, INVALID_DESCRIPTION_MSG));
  }

  // Update configuration
  barkley.updateConfiguration(idConfiguration, props, function(err, configuration) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConfiguration)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_NAME_MSG));
      }
      return next(err);
    }
    res.json(configuration);
  });
}

function deleteConfiguration(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  // Delete configuration
  barkley.deleteConfiguration(idConfiguration, function(err, configuration) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConfiguration)));
      }
      return next(err);
    }
    res.json(configuration);
  });
}



// ////////////////////////////////////////
// Configurations Filters
// ////////////////////////////////////////

function listConfigurationFilters(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var type = req.params.type;
  // List filters
  barkley.findConfigurationFilters(idConfiguration, type, function(err, filters) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConfiguration)));
      }
      return next(err);
    }
    res.json(filters);
  });
}

function getConfigurationFilter(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Get resource
  barkley.getConfigurationFilterById(idConfiguration, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_CONFIGURATION_FOUND_MSG, idConfiguration, idFilter)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function attachConfigurationFilter(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Add filter
  barkley.attachConfigurationFilter(idConfiguration, idFilter, type, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_CONFIGURATION_FOUND_MSG, idConfiguration, idFilter)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_CONFIGURATION_FILTER_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function detachConfigurationFilter(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idFilter = req.params.idFilter;
  var type = req.params.type;
  // Delete resource
  barkley.detachConfigurationFilter(idConfiguration, idFilter, type, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_CONFIGURATION_FOUND_MSG, idConfiguration, idFilter)));
      }
      return next(err);
    }
    res.json(resource);
  });
}



// ////////////////////////////////////////
// Configurations Providers
// ////////////////////////////////////////

function listConfigurationProviders(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  // List providers
  barkley.findConfigurationProviders(idConfiguration, function(err, providers) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_ENTITY_ID_FOUND_MSG, idConfiguration)));
      }
      return next(err);
    }
    res.json(providers);
  });
}

function getConfigurationProvider(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idProvider = req.params.idProvider;
  // Get resource
  barkley.getConfigurationProviderById(idConfiguration, idProvider, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_PROVIDER_CONFIGURATION_FOUND_MSG, idConfiguration, idProvider)));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function attachConfigurationProvider(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idProvider = req.params.idProvider;
  // Add filter
  barkley.attachConfigurationProvider(idConfiguration, idProvider, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_PROVIDER_CONFIGURATION_FOUND_MSG, idConfiguration, idProvider)));
      }
      if (err instanceof Errors.DuplicatedEntity) {
        return next(new HttpError(409, DUPLICATED_CONFIGURATION_FILTER_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}

function detachConfigurationProvider(req, res, next) {
  var idConfiguration = req.params.idConfiguration;
  var idProvider = req.params.idProvider;
  // Delete resource
  barkley.detachConfigurationProvider(idConfiguration, idProvider, function(err, resource) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_PROVIDER_CONFIGURATION_FOUND_MSG, idConfiguration, idProvider)));
      }
      return next(err);
    }
    res.json(resource);
  });
}


// ///////////////////////////////////////////////////////////////////////////
// Routers configuration
// ///////////////////////////////////////////////////////////////////////////

// Configure routes
router.use(configurationsRoutes);
router.use(providersRoutes);
router.use(consumersRoutes);
router.use(filtersRoutes);


//
// Consumers
//
consumersRoutes.get("/consumers", listConsumers);
consumersRoutes.get("/consumers/:idConsumer", getConsumer);
consumersRoutes.post("/consumers", addConsumer);
consumersRoutes.put("/consumers/:idConsumer", updateConsumer);
consumersRoutes.delete("/consumers/:idConsumer", deleteConsumer);

consumersRoutes.get("/consumers/:idConsumer/consumerconfig", listConsumerFilterConfigs);
consumersRoutes.get("/consumers/:idConsumer/consumerconfig/:idFilter", getConsumerFilterConfig);
consumersRoutes.post("/consumers/:idConsumer/consumerconfig/:idFilter", addConsumerFilterConfig);
consumersRoutes.put("/consumers/:idConsumer/consumerconfig/:idFilter", updateConsumerFilterConfig);
consumersRoutes.delete("/consumers/:idConsumer/consumerconfig/:idFilter", deleteConsumerFilterConfig);


//
// Filters
//
filtersRoutes.get("/filters", listFilters);
filtersRoutes.get("/filters/:idFilter", getFilter);
filtersRoutes.post("/filters", addFilter);
filtersRoutes.put("/filters/:idFilter", updateFilter);
filtersRoutes.delete("/filters/:idFilter", deleteFilter);

filtersRoutes.get("/filters/:idFilter/consumerconfig", listFilterConsumerConfigs);
filtersRoutes.get("/filters/:idFilter/consumerconfig/:idConsumer", getConsumerFilterConfig);


//
// Providers
//
providersRoutes.get("/providers", listProviders);
providersRoutes.get("/providers/:idProvider", getProvider);
providersRoutes.post("/providers", addProvider);
providersRoutes.put("/providers/:idProvider", updateProvider);
providersRoutes.delete("/providers/:idProvider", deleteProvider);

// Provider Filters
providersRoutes.get("/providers/:idProvider/:type(prefilters|postfilters)", listProviderFilters);
providersRoutes.get("/providers/:idProvider/:type(prefilters|postfilters)/:idFilter", getProviderFilter);
providersRoutes.post("/providers/:idProvider/:type(prefilters|postfilters)/:idFilter", attachProviderFilter);
providersRoutes.delete("/providers/:idProvider/:type(prefilters|postfilters)/:idFilter", detachProviderFilter);

// Provider Resources
providersRoutes.get("/providers/:idProvider/resources", listProviderResources);
providersRoutes.get("/providers/:idProvider/resources/:idResource", getProviderResource);
providersRoutes.post("/providers/:idProvider/resources", addProviderResource);
providersRoutes.put("/providers/:idProvider/resources/:idResource", updateProviderResource);
providersRoutes.delete("/providers/:idProvider/resources/:idResource", deleteProviderResource);

// Provider Resource Filter
providersRoutes.get("/providers/:idProvider/resources/:idResource/:type(prefilters|postfilters)", listResourceFilters);
providersRoutes.get("/providers/:idProvider/resources/:idResource/:type(prefilters|postfilters)/:idFilter", getResourceFilter);
providersRoutes.post("/providers/:idProvider/resources/:idResource/:type(prefilters|postfilters)/:idFilter", attachResourceFilter);
providersRoutes.delete("/providers/:idProvider/resources/:idResource/:type(prefilters|postfilters)/:idFilter", detachResourceFilter);



//
// Configurations
//
configurationsRoutes.get("/configurations", listConfigurations);
configurationsRoutes.get("/configurations/:idConfiguration", getConfiguration);
configurationsRoutes.post("/configurations", addConfiguration);
configurationsRoutes.put("/configurations/:idConfiguration", updateConfiguration);
configurationsRoutes.delete("/configurations/:idConfiguration", deleteConfiguration);

//
// Configurations filters
//
// Provider Filters
configurationsRoutes.get("/configurations/:idConfiguration/:type(prefilters|postfilters)", listConfigurationFilters);
configurationsRoutes.get("/configurations/:idConfiguration/:type(prefilters|postfilters)/:idFilter", getConfigurationFilter);
configurationsRoutes.post("/configurations/:idConfiguration/:type(prefilters|postfilters)/:idFilter", attachConfigurationFilter);
configurationsRoutes.delete("/configurations/:idConfiguration/:type(prefilters|postfilters)/:idFilter", detachConfigurationFilter);

//
// Configurations providers
//
configurationsRoutes.get("/configurations/:idConfiguration/providers", listConfigurationProviders);
configurationsRoutes.get("/configurations/:idConfiguration/providers/:idProvider", getConfigurationProvider);
configurationsRoutes.post("/configurations/:idConfiguration/providers/:idProvider", attachConfigurationProvider);
configurationsRoutes.delete("/configurations/:idConfiguration/providers/:idProvider", detachConfigurationProvider);


module.exports = function(barkleyImpl) {
  barkley = barkleyImpl;
  return router;
};