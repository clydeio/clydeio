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

// Global variable reference to butler backend implementation
var butler = null;


// /**
//  * Providers
//  */
//
// /**
//  * Gests a JSON array with all the configured providers or an empty array
//  * of there is no one.
//  * @param  {Request}   req  Request
//  * @param  {Response}  res  Response
//  * @param  {Function}  next Next
//  * @returns {Array<Provider>}  Array of providers with: id and target properties.
//  */
// function listProviders(req, res, next) {
//   butler.listProviders(function(err, providers) {
//     if (err) {
//       throw err;
//     }
//     res.json(providers);
//     next();
//   });
// }
//
//
// /**
//  * Get the provider identified by the identifier specified in the 'idProvider'
//  * parameter.
//  * @param  {Request}   req  Request
//  * @param  {Response}  res  Response
//  * @param  {Function}  next Next
//  * @returns {Provider}  Provider object
//  * @throws {404} NoEntityFound: If identifier is not found
//  */
// function getProvider(req, res, next) {
//   var idProvider = req.params.idProvider;
//   butler.getProvider(idProvider, function(err, provider) {
//     if (err) {
//       // Check if no entity found
//       if (err instanceof NoEntityFound) {
//         err.status = 404;
//       }
//       throw err;
//     }
//
//     res.json(provider);
//     return next();
//   });
// }
//
//
// /**
//  * Adds a new provider.
//  * @param  {Request}   req  Request
//  * @param  {Response}  res  Response
//  * @param  {Function}  next Next
//  * @returns {Provider}  The new added provider
//  * @throws {400} InvalidData: If specified provider has not got the minimum necessary properties.
//  * @throws {409} DuplicatedEntity: If provider ID exists.
//  */
// function addProvider(req, res, next) {
//   var providerProps = req.body;
//   butler.addProvider(providerProps, function(err, provider) {
//     if (err) {
//       // Check if provided data is invalid
//       if (err instanceof InvalidData) {
//         err.status = 400;
//       }
//       throw err;
//     }
//
//     res.json(provider);
//     return next();
//   });
// }
//
//
// /**
//  * Updates the specified provider with the new information.
//  * NOTE: Only 'context' and 'target' properties are allowed to be updated. Any
//  * other properties will be ignored.
//  *
//  * @param  {Request}   req  Request
//  * @param  {Response}  res  Response
//  * @param  {Function}  next Next
//  * @returns {void}  void
//  * @throws {404} If specified ID does not exists
//  */
// function updateProvider(req, res, next) {
//   var idProvider = req.params.idProvider;
//   var providerProps = req.body;
//
//   butler.updateProvider(idProvider, providerProps, function(err, provider) {
//     if (err) {
//       // Check if no entity found
//       if (err instanceof NoEntityFound) {
//         err.status = 404;
//       }
//       throw err;
//     }
//
//     res.json(provider);
//     return next();
//   });
// }
//
//
// /**
//  * Delete the specified provider.
//  * @param  {Request}   req  Request
//  * @param  {Response}  res  Response
//  * @param  {Function}  next Next
//  * @returns {void}
//  * @throws {404} If identifier is not found
//  */
// function deleteProvider(req, res, next) {
//   var idProvider = req.params.idProvider;
//
//   butler.deleteProvider(idProvider, function(err, provider) {
//     if (err) {
//       // Check if no entity found
//       if (err instanceof NoEntityFound) {
//         err.status = 404;
//       }
//       throw err;
//     }
//
//     res.json(provider);
//     return next();
//   });
// }





/**
 * Consumers
 */

var NO_CONSUMER_ID_FOUND_MSG = "No consumer found with ID='%s'.";
var INVALID_KEY_MSG = "'key' must contains only ASCII characters and have at least 12 characters length.";
var INVALID_SECRET_MSG = "'secret' must contains only ASCII characters and have at least 32 characters length.";
var DUPLICATED_KEY_MSG = "There is another consumer with the same 'key' value.";

function listConsumers(req, res, next) {
  butler.findConsumers(function(err, consumers) {
    if (err) {
      next(err);
    }
    res.json(consumers);
  });
}

function getConsumer(req, res, next) {
  var idConsumer = req.params.idConsumer;
  // Find consumer by id
  butler.getConsumerById(idConsumer, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONSUMER_ID_FOUND_MSG, idConsumer)));
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
  butler.addConsumer(props, function(err, consumer) {
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
  butler.updateConsumer(idConsumer, props, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONSUMER_ID_FOUND_MSG, idConsumer)));
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
  butler.deleteConsumer(idConsumer, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONSUMER_ID_FOUND_MSG, idConsumer)));
      }
      return next(err);
    }
    res.json(consumer);
  });
}


/**
 * Filters
 */

var NO_FILTER_ID_FOUND_MSG = "No consumer found with ID='%s'.";
var NO_CONFIG_FOUND_MSG = "No configuration found for FILTER_ID='%s' and CONSUMER_ID='%s'.";
var INVALID_MODULE_MSG = "'module' must contains only ASCII characters.";
var INVALID_NAME_MSG = "'name' must contains only ASCII characters.";
var INVALID_DESCRIPTION_MSG = "'description' must contains only ASCII characters.";
var INVALID_CONFIG_MSG = "'config' must be a valid object.";
var DUPLICATED_NAME_MSG = "There is another consumer with the same 'name' value.";
var FILTER_WITH_CONFIGURATIONS_MSG = "Filter has consumer's configurations attached. Remove configurations first."

function listFilters(req, res, next) {
  butler.findFilters(function(err, filters) {
    if (err) {
      next(err);
    }
    res.json(filters);
  });
}

function getFilter(req, res, next) {
  var idFilter = req.params.idFilter;
  // Find filter by id
  butler.getFilterById(idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_ID_FOUND_MSG, idFilter)));
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
  butler.addFilter(props, function(err, filter) {
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
  butler.updateFilter(idFilter, props, function(err, consumer) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_ID_FOUND_MSG, idFilter)));
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
  butler.deleteFilter(idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_ID_FOUND_MSG, idFilter)));
      }
      if (err instanceof Errors.EntityWithRelations) {
        return next(new HttpError(409, FILTER_WITH_CONFIGURATIONS_MSG));
      }
      return next(err);
    }
    res.json(filter);
  });
}


/**
 * Filter-Consumer config
 */

function listFilterConsumerConfigs(req, res, next) {
  var idFilter = req.params.idFilter;
  butler.findFilterConsumerConfigsByFilter(idFilter, function(err, configs) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_FILTER_ID_FOUND_MSG, idFilter)));
      }
      next(err);
    }
    res.json(configs);
  });
}

function listConsumerFilterConfigs(req, res, next) {
  var idConsumer = req.params.idConsumer;
  butler.findConsumerFilterConfigsByConsumer(idConsumer, function(err, configs) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONSUMER_ID_FOUND_MSG, idConsumer)));
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
  butler.getConsumerFilterConfigByFilterAndConsumer(idConsumer, idFilter, function(err, filter) {
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
  butler.addConsumerFilterConfig(idConsumer, idFilter, props, function(err, filter) {
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
  butler.updateConsumerFilterConfig(idConsumer, idFilter, props, function(err, filter) {
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
  butler.deleteConsumerFilterConfig(idConsumer, idFilter, function(err, filter) {
    if (err) {
      if (err instanceof Errors.NoEntityFound) {
        return next(new HttpError(404, util.format(NO_CONFIG_FOUND_MSG, idFilter, idConsumer)));
      }
      return next(err);
    }
    res.json(filter);
  });
}


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
// Configurations (We can list, get, create, modify and remove)
//
// configurationsRoutes.get("/configurations", listConfigurations);
// configurationsRoutes.get("/configurations/:idConfiguration", getConfiguration);
// configurationsRoutes.post("/configurations", addConfiguration);
// configurationsRoutes.put("/configurations/:idConfiguration", updateConfiguration);
// configurationsRoutes.delete("/configurations/:idConfiguration", deleteConfiguration);
//
// // Configuration filters (We can list, attach and dettach from the configuration)
// configurationsRoutes.get("/configurations/:idConfiguration/:type(prefilters|postfilters)", listConfigurationFilters);
// configurationsRoutes.post("/configurations/:idConfiguration/:type(prefilters|postfilters)/:idFilter", attachConfigurationFilter);
// configurationsRoutes.delete("/configurations/:idConfiguration/:type(prefilters|postfilters)/:idFilter", dettachConfigurationFilter);


//
// Providers (We can list, get, create, modify and remove)
//
// providersRoutes.get("/providers", listProviders);
// providersRoutes.get("/providers/:idProvider", getProvider);
// providersRoutes.post("/providers", addProvider);
// providersRoutes.put("/providers/:idProvider", updateProvider);
// providersRoutes.delete("/providers/:idProvider", deleteProvider);

// Providers contexts (We can list, attach and dettach from provier)
// providersRoutes.get("/providers/:idProvider/contexts", listProviderContexts);
// providersRoutes.post("/providers/:idProvider/contexts/:idContext", attachProviderContexts);
// providersRoutes.delete("/providers/:idProvider/contexts/:idContext", dettachProviderContexts);


//
// Contexts (We can list, get, create, modify and remove)
//
// providersRoutes.get("/contexts", listContexts);
// providersRoutes.get("/contexts/:idContext", getContext);
// providersRoutes.post("/contexts", addContext);
// providersRoutes.put("/contexts/:idContext", updateContext);
// providersRoutes.delete("/contexts/:idContext", deleteContext);


module.exports = function(butlerImpl) {
  butler = butlerImpl;
  return router;
};
