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

var NO_CONSUMER_ID_FOUND_MSG = "No consumer found with ID='%s'";
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
  // - props is Object
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
  // - props is Object
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
  console.log("deleteConsumer");
}


/**
 * Filters
 */

// function listFilters(req, res, next) {
// }
//
// function getFilter(req, res, next) {
// }
//
// function addFilter(req, res, next) {
// }
//
// function updateFilter(req, res, next) {
// }
//
// function deleteFilter(req, res, next) {
// }




// Configure routes
router.use(configurationsRoutes);
router.use(providersRoutes);
router.use(consumersRoutes);
router.use(filtersRoutes);


//
// Consumers (We can list, get, create, modify and remove)
//
consumersRoutes.get("/consumers", listConsumers);
consumersRoutes.get("/consumers/:idConsumer", getConsumer);
consumersRoutes.post("/consumers", addConsumer);
consumersRoutes.put("/consumers/:idConsumer", updateConsumer);
consumersRoutes.delete("/consumers/:idConsumer", deleteConsumer);


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
// Filters (We can list, get, create, modify and remove)
//
// filtersRoutes.get("/filters", listFilters);
// filtersRoutes.get("/filters/:idFilter", getFilter);
// filtersRoutes.post("/filters", addFilter);
// filtersRoutes.put("/filters/:idFilter", updateFilter);
// filtersRoutes.delete("/filters/:idFilter", deleteFilter);


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
