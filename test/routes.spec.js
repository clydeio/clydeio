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


  //
  // Providers
  //

  describe("providers", function() {

    var providerId = null;

    it("'[GET] /providers' should return an empty array of providers", function(done) {
      request("http://localhost:9999")
        .get("/providers")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.be.emtpy;
        })
        .end(done);
    });

    it("'[GET] /providers/{idProvider}' fails due not existent provider", function(done) {
      request("http://localhost:9999")
        .get("/providers/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[POST] /providers' fails creating a provier due invalid 'target' value", function(done) {
      var props = {
        notarget: ""
      };
      request("http://localhost:9999")
        .post("/providers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /providers' fails creating a provier due invalid 'context' value", function(done) {
      var props = {
        target: "http://someserver.com"
      };
      request("http://localhost:9999")
        .post("/providers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

    it("'[POST] /providers' should success creating a provier", function(done) {
      var props = {
        target: "http://someserver.com",
        context: "/context",
        description: "description for this provider"
      };
      request("http://localhost:9999")
        .post("/providers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body.id).to.be.not.null;
          expect(res.body.target).to.be.equal(props.target);
          expect(res.body.context).to.be.equal(props.context);
          expect(res.body.description).to.be.equal(props.description);

          // Store id
          providerId = res.body.id;
        })
        .end(done);
    });

    it("'[POST] /providers' fails creating a provier due duplicated 'context'", function(done) {
      var props = {
        target: "http://someserver.com",
        context: "/context",
        description: "description for this provider"
      };
      request("http://localhost:9999")
        .post("/providers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[GET] /providers/{idProvider}' should return a provider", function(done) {
      request("http://localhost:9999")
        .get("/providers/" + providerId)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .end(done);
    });

    it("'[PUT] /providers/{idProvider}' fails updating a non existent provier", function(done) {
      var props = {
        notarget: ""
      };
      request("http://localhost:9999")
        .put("/providers/notexists")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[PUT] /providers/{idProvider}' fails updating a provier due duplicated 'context' value", function(done) {
      var props = {
        target: "http://differentserver.com",
        context: "/context"
      };
      request("http://localhost:9999")
        .put("/providers/" + providerId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(409)
        .end(done);
    });

    it("'[PUT] /providers/{idProvider}' success updating a provier", function(done) {
      var props = {
        target: "http://differentserver.com",
        context: "/differentcontext"
      };
      request("http://localhost:9999")
        .put("/providers/" + providerId)
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .end(done);
    });


    it("'[DELETE] /providers/{idProvider}' fails deleting a not existent provier", function(done) {
      request("http://localhost:9999")
        .delete("/providers/notexists")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404)
        .end(done);
    });

    it("'[DELETE] /providers/{idProvider}' success deleting a provier without resources", function(done) {
      request("http://localhost:9999")
        .delete("/providers/" + providerId)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .end(done);
    });

    describe("delete with resources", function() {

      var resourceId = null;

      before(function(done) {
        // Create a test provider
        var props = {
          target: "http://someserver.com",
          context: "/context",
          description: "description for this provider"
        };
        request("http://localhost:9999")
          .post("/providers")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.target).to.be.equal(props.target);
            expect(res.body.context).to.be.equal(props.context);
            expect(res.body.description).to.be.equal(props.description);

            // Store id
            providerId = res.body.id;
          })
          .end(function() {
            // Create test resource
            var propsResource = {
              path: "/somepath",
              description: "a test resource"
            };
            request("http://localhost:9999")
              .post("/providers/" + providerId + "/resources")
              .send(propsResource)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .expect(function(res) {
                expect(res.body.id).to.be.not.null;
                expect(res.body.path).to.be.equal(propsResource.path);

                // Store resource id
                resourceId = res.body.id;
              })
              .end(done);
          });
      });

      it("'[DELETE] /providers/{idProvider}' success deleting a provier with resources", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            // Check there is no resource
            request("http://localhost:9999")
              .get("/providers/" + providerId + "/resources/" + resourceId)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(404)
              .end(done);
          });
      });

    });

    describe("delete with filters", function() {

      var filterId = null;

      before(function(done) {
        // Create a test provider
        var props = {
          target: "http://someserver.com",
          context: "/context",
          description: "description for this provider"
        };
        request("http://localhost:9999")
          .post("/providers")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.target).to.be.equal(props.target);
            expect(res.body.context).to.be.equal(props.context);
            expect(res.body.description).to.be.equal(props.description);

            // Store id
            providerId = res.body.id;
          })
          .end(function() {
            // Create test filter
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

                filterId = res.body.id;
              })
              .end(function() {
                // Attach filter to provier as prefilter
                request("http://localhost:9999")
                  .post("/providers/" + providerId + "/prefilters/" + filterId)
                  .set("Accept", "application/json")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .expect(function(res) {
                    expect(res.body.id).to.be.equal(filterId);
                  })
                  .end(done);
              });
          });
      });

      after(function(done) {
        // Remove filter. Provider is deleted within the text
        request("http://localhost:9999")
          .delete("/filters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            // Ensure filter is deleted
            request("http://localhost:9999")
              .delete("/filters/" + filterId)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(404)
              .end(done);
          });
      });

      it("'[DELETE] /providers/{idProvider}' success deleting provider with filters", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            // Check there is no resource
            request("http://localhost:9999")
              .get("/providers/" + providerId + "/prefilters/" + filterId)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(404)
              .end(done);
          });
      });

    });

    describe("provider filters", function() {

      var filterId = null;

      before(function(done) {
        // Create a test provider
        var props = {
          target: "http://someserver.com",
          context: "/context",
          description: "description for this provider"
        };
        request("http://localhost:9999")
          .post("/providers")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.target).to.be.equal(props.target);
            expect(res.body.context).to.be.equal(props.context);
            expect(res.body.description).to.be.equal(props.description);

            // Store id
            providerId = res.body.id;
          })
          .end(function() {
            // Create test filter
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

                filterId = res.body.id;
              })
              .end(done);
          });
      });

      after(function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .get("/providers/notexists/prefilters")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters' should return an empty array", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/prefilters")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.be.instanceof(Array);
            expect(res.body).to.be.empty;
          })
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters/{idFilter}' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .get("/providers/notexists/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters/{idFilter}' fails due filter do not exists", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/prefilters/{idFilter}' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .post("/providers/notexists/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/prefilters/{idFilter}' fails due filter do not exists", function(done) {
        request("http://localhost:9999")
          .post("/providers/" + providerId + "/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/prefilters/{idFilter}' success attaching a filter", function(done) {
        request("http://localhost:9999")
          .post("/providers/" + providerId + "/prefilters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.equal(filterId);
          })
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/prefilters/{idFilter}' fails due filter already attached", function(done) {
        request("http://localhost:9999")
          .post("/providers/" + providerId + "/prefilters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(409)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters/{idFilter}' success returning a filter", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/prefilters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.equal(filterId);
          })
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/prefilters' should return an array with one element", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/prefilters")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.be.instanceof(Array);
            expect(res.body).to.have.length(1);
          })
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/prefilters/{idFilter}' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .delete("/providers/notexists/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/prefilters/{idFilter}' fails due filter do not exists", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId + "/prefilters/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/prefilters/{idFilter}' success detaching a filter", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId + "/prefilters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.equal(filterId);
          })
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/prefilters/{idFilter}' fails detaching a filter due it is not attached", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId + "/prefilters/" + filterId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

    });


    describe("provider resources", function() {

      var resourceId = null;

      before(function(done) {
        // Create a test provider
        var props = {
          target: "http://someserver.com",
          context: "/context",
          description: "description for this provider"
        };
        request("http://localhost:9999")
          .post("/providers")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.target).to.be.equal(props.target);
            expect(res.body.context).to.be.equal(props.context);
            expect(res.body.description).to.be.equal(props.description);

            // Store id
            providerId = res.body.id;
          })
          .end(done);
      });

      after(function(done) {
        // Remove the test provider
        request("http://localhost:9999")
          .delete("/providers/" + providerId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/resources' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .get("/providers/notexists/resources")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/resources' success returning an empty array of resources", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/resources")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.be.instanceOf(Array);
            expect(res.body).to.be.emtpy;
          })
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/resources/{idResource}' fails due provider do not exists", function(done) {
        request("http://localhost:9999")
          .get("/providers/notexists/resources/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/resources/{idResource}' fails returning a non existent resource", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/resources/notexsists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/resources' fails creating due invalid 'path' value", function(done) {
        var props = {
          nopath: ""
        };
        request("http://localhost:9999")
          .post("/providers/notexists/resources")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(400)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/resources' fails creating due provider do not exists", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .post("/providers/notexists/resources")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/resources' success creating a new resource", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .post("/providers/" + providerId + "/resources")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .expect(function(res) {
            expect(res.body.id).to.be.not.null;
            expect(res.body.path).to.be.equal(props.path);

            // Store resource id
            resourceId = res.body.id;
          })
          .end(done);
      });

      it("'[POST] /providers/{idProvider}/resources' fails creating due path is duplicated", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .post("/providers/" + providerId + "/resources")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(409)
          .end(done);
      });

      it("'[GET] /providers/{idProvider}/resources/{idResource}' success returning a resource", function(done) {
        request("http://localhost:9999")
          .get("/providers/" + providerId + "/resources/" + resourceId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[PUT] /providers/{idProvider}/resources/{idResource}' fails updating due provider do not exists", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .put("/providers/notexists/resources/notexists")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[PUT] /providers/{idProvider}/resources/{idResource}' fails updating due resource do not exists", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .put("/providers/" + providerId + "/resources/notexists")
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[PUT] /providers/{idProvider}/resources' fails updating due invalid 'path' value", function(done) {
        var props = {
          nopath: ""
        };
        request("http://localhost:9999")
          .put("/providers/" + providerId + "/resources/" + resourceId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(400)
          .end(done);
      });

      it("'[PUT] /providers/{idProvider}/resources/{idResource}' fails updating due path is duplicated", function(done) {
        var props = {
          path: "/somepath"
        };
        request("http://localhost:9999")
          .put("/providers/" + providerId + "/resources/" + resourceId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(409)
          .end(done);
      });

      it("'[PUT] /providers/{idProvider}/resources/{idResource}' success updating a resource", function(done) {
        var props = {
          path: "/somenewpath"
        };
        request("http://localhost:9999")
          .put("/providers/" + providerId + "/resources/" + resourceId)
          .send(props)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/resources/{idResource}' fails deleting due provider not exists", function(done) {
        request("http://localhost:9999")
          .delete("/providers/notexists/resources/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/resources/{idResource}' fails deleting due resource not exists", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId + "/resources/notexists")
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(404)
          .end(done);
      });

      it("'[DELETE] /providers/{idProvider}/resources/{idResource}' success deleting a resource", function(done) {
        request("http://localhost:9999")
          .delete("/providers/" + providerId + "/resources/" + resourceId)
          .set("Accept", "application/json")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect(200)
          .end(function() {
            request("http://localhost:9999")
              .delete("/providers/" + providerId + "/resources/" + resourceId)
              .set("Accept", "application/json")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(404)
              .end(done);
          });
      });

      describe("provider resource filters", function() {

        it.skip("'[GET] /providers/{idProvider}/resources/{idResource}/prefilters' fails due provider do not exists", function(done) {

        });

      });

    });

  });

});
