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
  // Filters
  //
  // describe("filters", function() {
  //
  //   var filterId = null;
  //
  //   it("'[GET] /filters' should get an emtpy filters array", function(done) {
  //     request("http://localhost:9999")
  //       .get("/filters")
  //       .set("Accept", "application/json")
  //       .expect("Content-Type", "application/json; charset=utf-8")
  //       .expect(200)
  //       .expect(function(res) {
  //         expect(res.body).to.be.instanceOf(Array);
  //         expect(res.body).to.be.emtpy;
  //       })
  //       .end(done);
  //   });
  //
  // });



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

    it("'[PUT] /consumers' fails due invalid 'key' valye", function(done) {
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

    it("'[PUT] /consumers' fails due invalid 'secret' valye", function(done) {
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

  });

});
