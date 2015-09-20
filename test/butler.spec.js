/* eslint-disable no-unused-expressions */
"use strict";

var expect = require("chai").expect;
var butler = require("../lib/butler");


describe("butler (memory backend)", function() {

  //
  // Test consumer operations
  //
  describe("consumers", function() {

    var consumerId;

    it("listConsumers should return an emtpy array", function(done) {
      butler.findConsumers(function(err, consumers) {
        if (err) {
          throw err;
        }
        expect(consumers).to.be.instanceof(Array);
        expect(consumers).to.be.empty;
        done();
      });
    });

    it("getConsumer should return null getting a non existent consumer id", function(done) {
      butler.findConsumerById("not-exists", function(err, consumer) {
        expect(err).to.be.null;
        expect(consumer).to.be.null;
        done();
      });
    });

    it("addConsumer fails due invalid data", function(done) {
      var props = {};
      butler.addConsumer(props, function(err) {
        expect(err).to.be.not.null();
        done();
      });
    });

    // it("addConsumer should create a new consumer", function(done) {
    //   var props = {
    //     key: "",
    //     secret: ""
    //   };
    //   butler.addConsumer({}, function(err, consumer) {
    //     if (err) {
    //       throw err;
    //     }
    //     expect(consumer.id).to.be.not.empty;
    //     expect(consumer.key).to.be.not.empty;
    //     // Store consumer id for later operation
    //     consumerId = consumer.id;
    //     done();
    //   });
    // });

    // it("listConsumers should return an array of consumers", function(done) {
    //   butler.listConsumers(function(err, consumers) {
    //     if (err) {
    //       throw err;
    //     }
    //     expect(consumers).to.be.instanceof(Array);
    //     expect(consumers).to.have.length(1);
    //     done();
    //   });
    // });
    //
    // it("getConsumer should success getting the previously created consumer", function(done) {
    //   butler.getConsumer(consumerId, function(err, consumer) {
    //     if (err) {
    //       throw err;
    //     }
    //     expect(consumer.id).to.be.not.empty;
    //     expect(consumer.key).to.be.not.empty;
    //     done();
    //   });
    // });
    //
    // it("updateConsumerKey should success updating the consumer key", function(done) {
    //   butler.getConsumer(consumerId, function(errGet, consumer) {
    //     if (errGet) {
    //       throw errGet;
    //     }
    //     butler.updateConsumerKey(consumerId, function(err, updatedConsumer) {
    //       if (err) {
    //         throw err;
    //       }
    //       expect(updatedConsumer.id).to.be.equal(consumer.id);
    //       expect(updatedConsumer.secret).to.be.equal(consumer.secret);
    //       expect(updatedConsumer.key).to.be.not.equal(consumer.key);
    //       done();
    //     });
    //   });
    // });
    //
    // it("updateConsumerSecret should success updating the consumer secret", function(done) {
    //   butler.getConsumer(consumerId, function(errGet, consumer) {
    //     if (errGet) {
    //       throw errGet;
    //     }
    //     butler.updateConsumerSecret(consumerId, function(err, updatedConsumer) {
    //       if (err) {
    //         throw err;
    //       }
    //       expect(updatedConsumer.id).to.be.equal(consumer.id);
    //       expect(updatedConsumer.key).to.be.equal(consumer.key);
    //       expect(updatedConsumer.secret).to.be.not.equal(consumer.secret);
    //       done();
    //     });
    //   });
    // });
    //
    // it("deleteConsumer should fail deleting a non existent consumer", function(done) {
    //   butler.deleteConsumer("not-exists", function(err) {
    //     expect(err).to.be.instanceof(NoEntityFound);
    //     done();
    //   });
    // });
    //
    // it("deleteConsumer should success deleting an existent consumer", function(done) {
    //   butler.deleteConsumer(consumerId, function(err, consumer) {
    //     if (err) {
    //       throw err;
    //     }
    //     // First delete must return the deleted consumer
    //     expect(consumer.id).to.be.equal(consumerId);
    //     expect(consumer.key).to.be.not.empty;
    //
    //     // Second delete must fail
    //     butler.deleteConsumer(consumerId, function(errDelete) {
    //       expect(errDelete).to.be.instanceof(NoEntityFound);
    //       done();
    //     });
    //   });
    // });

  });


  //
  // Test provider operations
  //
  // describe("providers", function() {
  //
  //   var providerId;
  //
  //   it("listProviders should return an emtpy array", function(done) {
  //     butler.listProviders(function(err, providers) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(providers).to.be.instanceof(Array);
  //       expect(providers).to.be.empty;
  //       done();
  //     });
  //   });
  //
  //   it("getProvider should fail getting a non existent provider id", function(done) {
  //     butler.getProvider("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should fail creating a provider with invalid data", function(done) {
  //     butler.addProvider(null, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should fail creating a provider with invalid target", function(done) {
  //     var props = {
  //       target: 0
  //     };
  //     butler.addProvider(props, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should fail creating a provider with invalid context path", function(done) {
  //     var props = {
  //       target: "target",
  //       path: 0
  //     };
  //     butler.addProvider(props, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should create a new provider", function(done) {
  //     var props = {
  //       target: "http://target_server",
  //       path: "/context"
  //     };
  //
  //     butler.addProvider(props, function(err, provider) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(provider.id).to.be.not.empty;
  //       expect(provider.target).to.be.equal(props.target);
  //       expect(provider.context.id).to.be.not.empty;
  //       expect(provider.context.path).to.be.equal(props.path);
  //
  //       // Store provider id for later operation
  //       providerId = provider.id;
  //
  //       done();
  //     });
  //   });
  //
  //   it("listProviders should return an array of providers", function(done) {
  //     butler.listProviders(function(err, providers) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(providers).to.be.instanceof(Array);
  //       expect(providers).to.have.length(1);
  //       done();
  //     });
  //   });
  //
  //   it("getProvider should success getting the previously created provider", function(done) {
  //     butler.getProvider(providerId, function(err, provider) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(provider.id).to.be.not.empty;
  //       expect(provider.target).to.be.not.empty;
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should fail creating a provider with existent target", function(done) {
  //     var props = {
  //       target: "http://target_server",
  //       path: "/different_context"
  //     };
  //
  //     butler.addProvider(props, function(err) {
  //       expect(err).to.be.instanceof(DuplicatedEntity);
  //       done();
  //     });
  //   });
  //
  //   it("addProvider should fail creating a provider with existent root context path", function(done) {
  //     var props = {
  //       target: "http://different_target_server",
  //       path: "/context"
  //     };
  //
  //     butler.addProvider(props, function(err) {
  //       expect(err).to.be.instanceof(DuplicatedEntity);
  //       done();
  //     });
  //   });
  //
  //   it("updateProviderTarget should fail updating a non existent provider", function(done) {
  //     butler.updateProviderTarget("not-exists", {}, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("updateProviderTarget should success updating an existent provider", function(done) {
  //     var target = "http://new_target_server";
  //     butler.updateProviderTarget(providerId, target, function(err, provider) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(provider.id).to.be.equal(providerId);
  //       expect(provider.target).to.be.equal(target);
  //       done();
  //     });
  //   });
  //
  //   it("deleteProvider should fail deleting a non existent provider", function(done) {
  //     butler.deleteProvider("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("deleteProvider should success deleting an existent provider", function(done) {
  //     butler.deleteProvider(providerId, function(err, provider) {
  //       if (err) {
  //         throw err;
  //       }
  //
  //       // First delete must return the deleted provider
  //       expect(provider.id).to.be.equal(providerId);
  //       expect(provider.target).to.be.not.empty;
  //
  //       // Second delete must fail
  //       butler.deleteProvider(providerId, function(errDelete) {
  //         expect(errDelete).to.be.instanceof(NoEntityFound);
  //         done();
  //       });
  //     });
  //   });
  //
  // });
  //
  //
  // //
  // // Test context operations
  // //
  // describe("contexts", function() {
  //
  //   var contextId;
  //
  //   before(function(done) {
  //     // Create a provider with a root context
  //     var props = {
  //       target: "http://target_server",
  //       path: "/context"
  //     };
  //     butler.addProvider(props, function(err, provider) {
  //       if (err) {
  //         throw err;
  //       }
  //       // Store context id
  //       contextId = provider.context.id;
  //       done();
  //     });
  //   });
  //
  //   it("getContext fails getting a non existent id", function(done) {
  //     butler.getContext("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("listContexts should return an array with one element", function(done) {
  //     butler.listContexts(function(err, contexts) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(contexts).to.be.instanceof(Array);
  //       expect(contexts).to.have.length(1);
  //       contextId = contexts[0].id;
  //       done();
  //     });
  //   });
  //
  //   it("getContext should return one element", function(done) {
  //     butler.getContext(contextId, function(err, context) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(context.id).to.be.not.null;
  //       expect(context.path).to.be.not.null;
  //       done();
  //     });
  //   });
  //
  //   it("addContextChild fails adding context to not existent parent context", function(done) {
  //     var idParent = "not-existent-parent";
  //     var props = {
  //       path: "/subPath"
  //     };
  //     butler.addContextChild(idParent, props, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("addContextChild fails adding context due invalid data", function(done) {
  //     butler.addContextChild(contextId, null, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addContextChild fails adding context due invalid 'path' parameter", function(done) {
  //     butler.addContextChild(contextId, null, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addContextChild should add a new context", function(done) {
  //     var props = {
  //       path: "/subPath"
  //     };
  //     butler.addContextChild(contextId, props, function(err, context) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(context.children).to.be.not.null;
  //       expect(context.children).to.have.length(1);
  //       expect(context.children[0].id).to.be.not.null;
  //       done();
  //     });
  //   });
  //
  //   it("addContextChild fails adding a context with duplicated path", function(done) {
  //     var props = {
  //       path: "/subPath"
  //     };
  //     butler.addContextChild(contextId, props, function(err) {
  //       expect(err).to.be.instanceof(DuplicatedEntity);
  //       done();
  //     });
  //   });
  //
  //   it("updateContextPath fails updating a non existent context", function(done) {
  //     butler.updateContextPath("not-exists", null, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("updateContextPath should success", function(done) {
  //     var path = "/new_path";
  //     butler.updateContextPath(contextId, path, function(err, context) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(context.id).to.be.equal(contextId);
  //       expect(context.path).to.be.equal(path);
  //       done();
  //     });
  //   });
  //
  //   it("deleteContext fails deleting a non existent context", function(done) {
  //     butler.deleteContext("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("deleteContext should delete a context", function(done) {
  //     butler.deleteContext(contextId, function(errDelete, context) {
  //       expect(errDelete).to.be.null;
  //       expect(context.id).to.be.equal(contextId);
  //       butler.getContext(contextId, function(errGet) {
  //         expect(errGet).to.be.instanceof(NoEntityFound);
  //         done();
  //       });
  //     });
  //   });
  //
  //   it.skip("deleteContext fails deleting a provider's root context", function(done) {
  //     throw new Error("not implemented yet !!!");
  //   });
  //
  //   it.skip("deleteContext fails deleting context with children", function(done) {
  //     throw new Error("not implemented yet !!!");
  //   });
  //
  // });
  //
  //
  // //
  // // Test filters operations
  // //
  // describe("filters", function() {
  //
  //   var filterId, contextId;
  //
  //   before(function(done) {
  //     butler.listContexts(function(err, contexts) {
  //       if (err) {
  //         throw err;
  //       }
  //       contextId = contexts[0].id;
  //       done();
  //     });
  //   });
  //
  //   it("listFilters should return an empty array", function(done) {
  //     butler.listFilters(function(err, filters) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filters).to.have.length(0);
  //       done();
  //     });
  //   });
  //
  //   it("getFilter fails getting a non existent id", function(done) {
  //     butler.getFilter("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("addFilter fails creating a new filter due invalid data", function(done) {
  //     var props = null;
  //     butler.addFilter(props, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addFilter fails creating a new filter due invalid type", function(done) {
  //     var props = {
  //       type: "cosa"
  //     };
  //     butler.addFilter(props, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addFilter fails creating a new filter due invalid config", function(done) {
  //     var props = {
  //       type: "prefilter",
  //       config: null
  //     };
  //     butler.addFilter(props, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("addFilter should success creating a new filter", function(done) {
  //     var props = {
  //       type: "prefilter",
  //       config: {}
  //     };
  //     butler.addFilter(props, function(err, filter) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filter.id).to.be.not.empty;
  //       expect(filter.type).to.be.equal(props.type);
  //       expect(filter.config).to.be.equal(props.config);
  //       // Store filter ID for later use
  //       filterId = filter.id;
  //       done();
  //     });
  //   });
  //
  //   it("listFilters should return an array with one element", function(done) {
  //     butler.listFilters(function(err, filters) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filters).to.have.length(1);
  //       expect(filters[0].id).to.be.equal(filterId);
  //       done();
  //     });
  //   });
  //
  //   it("getFilter should return a filter", function(done) {
  //     butler.getFilter(filterId, function(err, filter) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filter).to.be.not.null;
  //       expect(filter.id).to.be.equal(filterId);
  //       done();
  //     });
  //   });
  //
  //   it("updateFilterType fails updating a non existent filter", function(done) {
  //     butler.updateFilterType("not-exists", null, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("updateFilterType fails updating due invalid type value", function(done) {
  //     butler.updateFilterType(filterId, "invalidType", function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("updateFilterType should success", function(done) {
  //     butler.updateFilterType(filterId, "postfilter", function(err, filter) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filter.id).to.be.equal(filterId);
  //       expect(filter.type).to.be.equal("postfilter");
  //       done();
  //     });
  //   });
  //
  //   it("updateFilterConfig fails updating due invalid object", function(done) {
  //     butler.updateFilterConfig(filterId, null, function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it("updateFilterConfig should success", function(done) {
  //     var config = {
  //       new: "param"
  //     }
  //     butler.updateFilterConfig(filterId, config, function(err, filter) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filter.id).to.be.equal(filterId);
  //       expect(filter.config).to.be.equal(config);
  //       done();
  //     });
  //   });
  //
  //   it("deleteFilter fails deleting a non existent filter", function(done) {
  //     butler.deleteFilter("not-exists", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("deleteFilter should delete a filter", function(done) {
  //     butler.deleteFilter(filterId, function(errDelete, filter) {
  //       expect(errDelete).to.be.null;
  //       expect(filter.id).to.be.equal(filterId);
  //       butler.getFilter(filterId, function(errGet) {
  //         expect(errGet).to.be.instanceof(NoEntityFound);
  //         done();
  //       });
  //     });
  //   });
  //
  // });
  //
  //
  // //
  // // Test filters-consumer configs operations
  // //
  // describe("filter-consumer", function() {
  //
  //   var filterId, consumerId;
  //
  //   before(function(done) {
  //     var props = {
  //       type: "prefilter",
  //       config: {}
  //     };
  //     butler.addFilter(props, function(err, filter) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(filter.id).to.be.not.empty;
  //       expect(filter.type).to.be.equal(props.type);
  //       expect(filter.config).to.be.equal(props.config);
  //       // Store filter ID for later use
  //       filterId = filter.id;
  //
  //       butler.addConsumer({}, function(err, consumer) {
  //         if (err) {
  //           throw err;
  //         }
  //         expect(consumer.id).to.be.not.empty;
  //         expect(consumer.key).to.be.not.empty;
  //         // Store consumer id for later operation
  //         consumerId = consumer.id;
  //         done();
  //       });
  //     });
  //   });
  //
  //   it("getFilterConsumersConfigByFilterId fails requesting a non existent filter", function(done) {
  //     butler.getFilterConsumersConfigByFilterId("not-exists", function(err, configs) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("getFilterConsumersConfigByFilterId should return an emty array of consumers configs", function(done) {
  //     butler.getFilterConsumersConfigByFilterId(filterId, function(err, configs) {
  //       if (err) {
  //         throw err;
  //       }
  //       expect(configs).to.have.length(0);
  //       done();
  //     });
  //   });
  //
  //   it("getFilterConsumerConfigByFilterIdAndConsumerId fails due not existent filter", function(done) {
  //     butler.getFilterConsumerConfigByFilterIdAndConsumerId("not-exists-filter", "not-exists-consumer", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("getFilterConsumerConfigByFilterIdAndConsumerId fails due not existent consumer", function(done) {
  //     butler.getFilterConsumerConfigByFilterIdAndConsumerId(filterId, "not-exists-consumer", function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("getFilterConsumerConfigByFilterIdAndConsumerId fails due no entity found", function(done) {
  //     butler.getFilterConsumerConfigByFilterIdAndConsumerId(filterId, consumerId, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it.skip("getFilterConsumerConfigByFilterIdAndConsumerId should return a filter-consumer configuration", function(done) {
  //     throw new Error("Not implemented yet !!!");
  //   });
  //
  //   it("addFilterConsumerConfig fails updating a non existent filter", function(done) {
  //     butler.addFilterConsumerConfig("not-exists-filter", "not-exists-consumer", {}, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("addFilterConsumerConfig fails updating a non existent consumer", function(done) {
  //     butler.addFilterConsumerConfig(filterId, "not-exists-consumer", {}, function(err) {
  //       expect(err).to.be.instanceof(NoEntityFound);
  //       done();
  //     });
  //   });
  //
  //   it("addFilterConsumerConfig fails due invalid config", function(done) {
  //     butler.addFilterConsumerConfig(filterId, consumerId, "bad-config", function(err) {
  //       expect(err).to.be.instanceof(InvalidData);
  //       done();
  //     });
  //   });
  //
  //   it.skip("addFilterConsumerConfig success adding consumer configuration", function() {
  //     throw new Error("Not implemented yet !!!");
  //   });
  //
  //   it.skip("deleteFilter fails deleting a filter with associated consumers config", function() {
  //     throw new Error("Not implemented yet !!!");
  //   });
  //
  // });
  //
  //
  // //
  // // Test context-filters operations
  // //
  // describe("context-filters", function() {
  //   it.skip("getContextFilter should return the context filter", function() {
  //     throw new Error("Not implemented yet !!!");
  //   });
  // });

});
