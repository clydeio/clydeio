/* eslint-disable no-unused-expressions */

"use strict";

var repository = require("../lib/butler/memory-repository"),
    butlerServer = require("../lib/butler/server"),
    expect = require("chai").expect,
    request = require("supertest");


describe("routes (memory backend)", function() {

  var server;

  before(function() {
    var opts = {
      port: 9999,
      repository: repository
    };
    server = butlerServer.startServer(opts);
  });

  after(function() {
    server.close();
  });


  //
  // Consumers
  //
  describe("consumers", function() {

    var consumerId = null;

    it("'[GET] /consumers' should get an emtpy consumers array", function(done) {
      request("http://localhost:9999")
        .get("/consumers")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.be.emtpy;
        })
        .end(done);
    });

    it("'[GET] /consumers/notexists' fails with 404 due consumer not exists", function(done) {
      request("http://localhost:9999")
        .get("/consumers/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[POST] /consumers' fails with 400 due invalid data", function(done) {
      var props = "bad_data";
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /consumers' fails with 400 due invalid 'key' property", function(done) {
      var props = {
        key: "short",
        secret: null
      };
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /consumers' fails with 400 due invalid 'secret' property", function(done) {
      var props = {
        key: "01234567890123456789",
        secret: null
      };
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /consumers' should success creating a new consumer", function(done) {
      var props = {
        key: "01234567890123456789",
        secret: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.not.null;
          expect(res.body.key).to.be.equal(props.key);
          expect(res.body.secret).to.be.equal(props.secret);

          consumerId = res.body.id;
        })
        .end(done);
    });

    it("'[POST] /consumers' fails due duplicated key", function(done) {
      var props = {
        key: "01234567890123456789",
        secret: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[PUT] /consumers' fails due invalid data", function(done) {
      var props = "bad_data";
      request("http://localhost:9999")
        .put("/consumers/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[PUT] /consumers' fails due too short 'key' value", function(done) {
      var props = {
        key: 123,
        secret: "1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .put("/consumers/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[PUT] /consumers' fails due too short 'secret' value", function(done) {
      var props = {
        key: "98765432109876543210",
        secret: "bad"
      };
      request("http://localhost:9999")
        .put("/consumers/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[PUT] /consumers' fails due not existent consumer", function(done) {
      var props = {
        key: "98765432109876543210",
        secret: "1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .put("/consumers/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[PUT] /consumers' should succes updating a consumer", function(done) {
      var props = {
        key: "98765432109876543210",
        secret: "1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .put("/consumers/" + consumerId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.equal(consumerId);
          expect(res.body.key).to.be.equal(props.key);
          expect(res.body.secret).to.be.equal(props.secret);
        })
        .end(done);
    });

    it("'[PUT] /consumers' fails due duplicated key", function(done) {
      var props = {
        key: "98765432109876543210",
        secret: "1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
      };
      request("http://localhost:9999")
        .put("/consumers/" + consumerId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[DELETE] /consumers' fails due not existent consumer", function(done) {
      request("http://localhost:9999")
        .delete("/consumers/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[DELETE] /consumers' should success deleteing a consumer", function(done) {
      request("http://localhost:9999")
        .delete("/consumers/" + consumerId)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .end(done);
    });

    //
    // Consumer-Filter configuration delete
    //
    describe("consumer delete", function() {

      var cid = null, fid = null;

      before(function(done) {
        // Create consumer
        var propsConsumer = {
          key: "abcdefghijklmnopqrstuvwxyz",
          secret: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
        };
        request("http://localhost:9999")
          .post("/consumers")
          .send(propsConsumer)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.key).to.be.equal(propsConsumer.key);
            expect(res.body.secret).to.be.equal(propsConsumer.secret);

            cid = res.body.id;
          })
          .end(function() {
            // Create filter
            var propsFilter = {
              module: "other path",
              name: "test filter name",
              description: "some description",
              config: {
                param: "value"
              }
            };
            request("http://localhost:9999")
              .post("/filters")
              .send(propsFilter)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .expect(function(res) {
                expect(res.body.id).to.be.not.null;
                expect(res.body.module).to.be.equal(propsFilter.module);
                expect(res.body.name).to.be.equal(propsFilter.name);
                expect(res.body.description).to.be.equal(propsFilter.description);
                expect(res.body.config.param).to.be.equal(propsFilter.config.param);

                fid = res.body.id;
              })
              .end(function() {
                // Create filter-consumer configuration
                var propsConf = {
                  config: {
                    paramA: "valueA",
                    paramB: "valueB"
                  }
                };
                request("http://localhost:9999")
                  .post("/consumers/" + cid + "/consumerconfig/" + fid)
                  .send(propsConf)
                  .set("Accept", "application/json")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .end(done);
              });
          });
      });

      after(function(done) {
        // Remove filter-consumer config
        request("http://localhost:9999")
          .delete("/filters/" + fid)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[DELETE] /consumers' should success deleting a consumer with configurations", function(done) {
        request("http://localhost:9999")
          .delete("/consumers/" + cid)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            request("http://localhost:9999")
              .get("/consumers/" + cid)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(404)
              .end(function() {
                request("http://localhost:9999")
                  .get("/consumers/" + cid + "/consumerconfig/" + fid)
                  .set("Accept", "application/json")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(404)
                  .end(done);
              });
          });
      });

    });


    //
    // Consumer-Filter configuration
    //
    describe("consumer-filter", function() {

      var filterId = null;

      before(function(done) {
        // Create consumer
        var propsConsumer = {
          key: "abcdefghijklmnopqrstuvwxyz",
          secret: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
        };
        request("http://localhost:9999")
          .post("/consumers")
          .send(propsConsumer)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.key).to.be.equal(propsConsumer.key);
            expect(res.body.secret).to.be.equal(propsConsumer.secret);

            consumerId = res.body.id;
          })
          .end(function() {
            // Create a test filter
            var propsFilter = {
              module: "some path",
              name: "some name"
            };
            request("http://localhost:9999")
              .post("/filters")
              .send(propsFilter)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .expect(function(res) {
                expect(res.body.id).to.be.not.null;
                expect(res.body.module).to.be.equal(propsFilter.module);
                expect(res.body.name).to.be.equal(propsFilter.name);
                expect(res.body.description).to.be.equal(propsFilter.description);
                expect(res.body.config).to.be.equal(propsFilter.config);

                filterId = res.body.id;
              })
              .end(done);
          });
      });

      after(function(done) {
        // Delete the test filter
        request("http://localhost:9999")
          .delete("/filters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[GET] /consumers/{idConsumer}/consumerconfig' fails due consumer not exists", function(done) {
        request("http://localhost:9999")
          .get("/consumers/notexists/consumerconfig")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /consumers/{idConsumer}/consumerconfig' should get an emtpy filters array", function(done) {
        request("http://localhost:9999")
          .get("/consumers/" + consumerId + "/consumerconfig")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.be.instanceOf(Array);
            expect(res.body).to.be.emtpy;
          })
          .end(done);
      });

      it("'[GET] /consumers/notexists/consumerconfig/{idConsumer}' fails with 404 due consumer not exists", function(done) {
        request("http://localhost:9999")
          .get("/consumers/notexists/consumerconfig/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /consumers/{idConsumer}/consumerconfig/notexists' fails with 404 due filter not exists", function(done) {
        request("http://localhost:9999")
          .get("/consumers/" + filterId + "/consumerconfig/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due no config found", function(done) {
        request("http://localhost:9999")
          .get("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due invalid 'config' data", function(done) {
        var props = "bad config";
        request("http://localhost:9999")
          .post("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(400)
          .end(done);
      });

      it("'[POST] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due no entity found", function(done) {
        var props = {
          config: {}
        };
        request("http://localhost:9999")
          .post("/consumers/" + consumerId + "/consumerconfig/notexists")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /consumers/{idConsumer}/consumerconfig/{idFilter}' should success creating a new configuration", function(done) {
        var props = {
          config: {
            paramA: "valueA",
            paramB: "valueB"
          }
        };
        request("http://localhost:9999")
          .post("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[POST] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due configuration already exists", function(done) {
        var props = {
          config: {
            paramA: "valueA",
            paramB: "valueB"
          }
        };
        request("http://localhost:9999")
          .post("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(409)
          .end(done);
      });

      it("'[PUT] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due invalid 'config' data", function(done) {
        var props = "bad config";
        request("http://localhost:9999")
          .put("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(400)
          .end(done);
      });

      it("'[PUT] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due no entity found", function(done) {
        var props = {
          config: {}
        };
        request("http://localhost:9999")
          .post("/consumers/" + consumerId + "/consumerconfig/notexists")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[PUT] /consumers/{idConsumer}/consumerconfig/{idFilter}' succes updating config", function(done) {
        var props = {
          config: {
            paramA: "123",
            paramB: "456"
          }
        };
        request("http://localhost:9999")
          .put("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[DELETE] /consumers/{idConsumer}/consumerconfig/{idFilter}' fails due no entity found", function(done) {
        request("http://localhost:9999")
          .delete("/consumers/" + consumerId + "/consumerconfig/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[DELETE] /consumers/{idConsumer}/consumerconfig/{idFilter}' succes deleting a config", function(done) {
        request("http://localhost:9999")
          .delete("/consumers/" + consumerId + "/consumerconfig/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

    });

  });


  //
  // Filters
  //
  describe("filters", function() {

    var filterId = null;

    it("'[GET] /filters' should get an emtpy filters array", function(done) {
      request("http://localhost:9999")
        .get("/filters")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.be.emtpy;
        })
        .end(done);
    });

    it("'[GET] /filters/notexists' fails with 404 due consumer not exists", function(done) {
      request("http://localhost:9999")
        .get("/filters/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[POST] /filters' fails with 400 due invalid data", function(done) {
      var props = "bad_data";
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /filters' fails with 400 due invalid 'module' property", function(done) {
      var props = {};
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /filters' fails with 400 due invalid 'name' property", function(done) {
      var props = {
        module: "some path"
      };
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /filters' fails with 400 due invalid 'config' property", function(done) {
      var props = {
        module: "some path",
        name: "some name",
        config: "bad config"
      };
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /filters' should success creating a new filter without global config", function(done) {
      var props = {
        module: "some path",
        name: "some name"
      };
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.not.null;
          expect(res.body.module).to.be.equal(props.module);
          expect(res.body.name).to.be.equal(props.name);
          expect(res.body.description).to.be.equal(props.description);
          expect(res.body.config).to.be.equal(props.config);

          filterId = res.body.id;
        })
        .end(done);
    });

    it("'[POST] /filters' should success creating a new filter with global config", function(done) {
      var props = {
        module: "other path",
        name: "other name",
        description: "some description",
        config: {
          param: "value"
        }
      };
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.not.null;
          expect(res.body.module).to.be.equal(props.module);
          expect(res.body.name).to.be.equal(props.name);
          expect(res.body.description).to.be.equal(props.description);
          expect(res.body.config.param).to.be.equal(props.config.param);

          filterId = res.body.id;
        })
        .end(done);
    });

    it("'[POST] /filters' fails due duplicated name", function(done) {
      var props = {
        module: "other path",
        name: "other name",
        description: "some description",
        config: {
          param: "value"
        }
      };
      request("http://localhost:9999")
        .post("/filters")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[PUT] /filters' fails due invalid data", function(done) {
      var props = "bad_data";
      request("http://localhost:9999")
        .put("/filters/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[PUT] /filters' fails due invalid 'config' value", function(done) {
      var props = {
        config: "bad config"
      };
      request("http://localhost:9999")
        .put("/filters/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[PUT] /filters' fails due not existent consumer", function(done) {
      var props = {
        module: "mymodule",
        name: "myfilter",
        description: "description for mymodule",
        config: {
          some: "config value"
        }
      };
      request("http://localhost:9999")
        .put("/filters/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[PUT] /filters' should succes updating a filter", function(done) {
      var props = {
        module: "mymodule",
        name: "myfilter",
        description: "description for mymodule",
        config: {
          some: "config value"
        }
      };
      request("http://localhost:9999")
        .put("/filters/" + filterId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.equal(filterId);
          expect(res.body.key).to.be.equal(props.key);
          expect(res.body.secret).to.be.equal(props.secret);
        })
        .end(done);
    });

    it("'[PUT] /filters' fails due duplicated name", function(done) {
      var props = {
        module: "mymodule",
        name: "myfilter",
        description: "description for mymodule",
        config: {
          some: "config value"
        }
      };
      request("http://localhost:9999")
        .put("/filters/" + filterId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[DELETE] /filters' fails due not existent filter", function(done) {
      request("http://localhost:9999")
        .delete("/filters/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[DELETE] /filters' should success deleteing a filter", function(done) {
      request("http://localhost:9999")
        .delete("/filters/" + filterId)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .end(done);
    });

    //
    // Filter-consumer
    //

    describe("filter-consumer", function() {

      var cid = null, fid = null;

      before(function(done) {
        // Create consumer
        var props = {
          key: "01234567890123456789",
          secret: "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
        };
        request("http://localhost:9999")
          .post("/consumers")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.key).to.be.equal(props.key);
            expect(res.body.secret).to.be.equal(props.secret);

            cid = res.body.id;
          })
          .end(function() {
            // Create filter
            var propsFilter = {
              module: "other path",
              name: "other name",
              description: "some description",
              config: {
                param: "value"
              }
            };
            request("http://localhost:9999")
              .post("/filters")
              .send(propsFilter)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .expect(function(res) {
                expect(res.body.id).to.be.not.null;
                expect(res.body.module).to.be.equal(propsFilter.module);
                expect(res.body.name).to.be.equal(propsFilter.name);
                expect(res.body.description).to.be.equal(propsFilter.description);
                expect(res.body.config.param).to.be.equal(propsFilter.config.param);

                fid = res.body.id;
              })
              .end(function() {
                // Create filter-consumer configuration
                var propsConfig = {
                  config: {
                    paramA: "valueA",
                    paramB: "valueB"
                  }
                };
                request("http://localhost:9999")
                  .post("/consumers/" + cid + "/consumerconfig/" + fid)
                  .send(propsConfig)
                  .set("Accept", "application/json")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .end(done);
              });
          });
      });

      after(function(done) {
        // Remove filter-consumer config
        request("http://localhost:9999")
          .delete("/consumers/" + cid + "/consumerconfig/" + fid)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            // Remove filter
            request("http://localhost:9999")
              .delete("/filters/" + fid)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .end(function() {
                // Remove consumer
                request("http://localhost:9999")
                  .delete("/consumers/" + cid)
                  .set("Accept", "application/json")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .end(done);
              });
          });
      });

      it("'[DELETE] /filters' should fail deleting a filter with configurations", function(done) {
        // Remove the filter
        request("http://localhost:9999")
          .delete("/filters/" + fid)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(409)
          .end(done);
      });

    });


  });


});
