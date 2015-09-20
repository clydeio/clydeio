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

    it("'[GET] /consumers' should get an emtpy consumers array", function(done) {
      request("http://localhost:9999")
        .get("/consumers")
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.be.emtpy; // eslint-disable-line no-unused-expressions
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
      var props = {}; // Bad values
      request("http://localhost:9999")
        .post("/consumers")
        .send(props)
        .set("Accept", "application/json")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400)
        .end(done);
    });

  });




  // describe("providers", function() {

    // var providerId; // eslint-disable-line no-unused-vars

    // it("should get an emtpy providers array", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       expect(res.body).to.be.instanceOf(Array);
    //       expect(res.body).to.be.emtpy; // eslint-disable-line no-unused-expressions
    //     })
    //     .end(done);
    // });
    //
    // it("fail getting a providers with non existent 'id'", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers/notexists")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(404)
    //     .expect(function(res) {
    //       expect(res.body).to.be.instanceOf(Object);
    //       expect(res.body).to.be.emtpy; // eslint-disable-line no-unused-expressions
    //     })
    //     .end(done);
    // });

    // it("fail adding a new provider due with no data", function(done) {
    //   request("http://localhost:9999")
    //     .post("/providers")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(400, done);
    // });
    //
    // it("fail adding a new provider due no 'context' specified", function(done) {
    //   var provider = {
    //     id: "pid",
    //     target: "http://targetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .post("/providers")
    //     .send(provider)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(400, done);
    // });
    //
    // it("fail adding a new provider due no 'target' specified", function(done) {
    //   var provider = {
    //     id: "pid",
    //     context: "/pid"
    //   };
    //
    //   request("http://localhost:9999")
    //     .post("/providers")
    //     .send(provider)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(400, done);
    // });
    //
    // it("should add a new provider", function(done) {
    //   var provider = {
    //     id: "pid",
    //     context: "/pid",
    //     target: "http://targetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .post("/providers")
    //     .send(provider)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json")
    //     .end(function(err, res) {   // eslint-disable-line handle-callback-err
    //       expect(res.status).to.be.equal(200);
    //       // Store id for next tests.
    //       providerId = res.body.id;
    //       request("http://localhost:9999")
    //         .get("/providers")
    //         .set("Accept", "application/json")
    //         .expect("Content-Type", "application/json; charset=utf-8")
    //         .expect(200)
    //         .expect(function(res2) {
    //           expect(res2.body).to.be.instanceOf(Array);
    //           expect(res2.body).to.have.length(1);
    //         })
    //         .end(done);
    //     });
    // });
    //
    // it("should get a providers with specified 'id'", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers/"+providerId)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       expect(res.body).to.be.instanceOf(Object);
    //       expect(res.body).to.be.not.emtpy; // eslint-disable-line no-unused-expressions
    //     })
    //     .end(done);
    // });
    //
    // it("should success updating a provider with no data", function(done) {
    //   request("http://localhost:9999")
    //     .put("/providers/"+providerId)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       expect(res.body).to.be.instanceOf(Object);
    //       expect(res.body).to.be.not.emtpy; // eslint-disable-line no-unused-expressions
    //       expect(res.body.id).to.be.equal(providerId);
    //     })
    //     .end(done);
    // });
    //
    // it("fail updating a provider due id does not exists", function(done) {
    //   var provider = {
    //     id: "pid",
    //     context: "/pid",
    //     target: "http://targetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .put("/providers/abc")
    //     .set("Accept", "application/json")
    //     .send(provider)
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(404, done);
    // });
    //
    // it("should update a provider ignoring the new id propety", function(done) {
    //   var provider = {
    //     id: "pid",
    //     context: "/pid",
    //     target: "http://targetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .put("/providers/"+providerId)
    //     .set("Accept", "application/json")
    //     .send(provider)
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       expect(res.body.id).to.be.equals(providerId);
    //       expect(res.body.context).to.be.equal(provider.context);
    //       expect(res.body.target).to.be.equal(provider.target);
    //     })
    //     .end(done);
    // });
    //
    // it("should update a provider", function(done) {
    //   var provider = {
    //     id: "abc",
    //     context: "/abc",
    //     target: "http://anothertargetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .put("/providers/"+providerId)
    //     .set("Accept", "application/json")
    //     .send(provider)
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .end(function(err, res) {   // eslint-disable-line handle-callback-err
    //       expect(res.status).to.be.equal(200);
    //       request("http://localhost:9999")
    //         .get("/providers/"+providerId)
    //         .set("Accept", "application/json")
    //         .expect("Content-Type", "application/json; charset=utf-8")
    //         .expect(function(res2) {
    //           expect(res2.status).to.be.equal(200);
    //           expect(res2.body.id).to.be.equal(providerId);
    //           expect(res2.body.context).to.be.equal(provider.context);
    //           expect(res2.body.target).to.be.equal(provider.target);
    //         })
    //         .end(done);
    //     });
    // });
    //
    // it("fail deleting a non existent provider", function(done) {
    //   request("http://localhost:9999")
    //     .delete("/providers/pid")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(404, done);
    // });
    //
    // it("should delete an existent provider", function(done) {
    //   request("http://localhost:9999")
    //     .delete("/providers/"+providerId)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .end(function(err, res) {   // eslint-disable-line handle-callback-err
    //       expect(res.status).to.be.equal(200);
    //       request("http://localhost:9999")
    //         .get("/providers/abc")
    //         .set("Accept", "application/json")
    //         .expect("Content-Type", "application/json; charset=utf-8")
    //         .expect(404, done);
    //     });
    // });

  // });

  // describe("resources", function() {

    // var providerId;

    // before(function(done) {
    //   // Create a provider for testing
    //   var provider = {
    //     context: "/provider_test",
    //     target: "http://targetserver"
    //   };
    //
    //   request("http://localhost:9999")
    //     .post("/providers")
    //     .send(provider)
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       providerId = res.body.id;
    //     })
    //     .end(done);
    // });
    //
    // it("fail getting resources from a non existent provider", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers/abc/resources")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(404, done);
    // });
    //
    // it("should get an emtpy resources array from a provider", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers/" + providerId + "/resources")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(200)
    //     .expect(function(res) {
    //       expect(res.body).to.be.instanceOf(Array);
    //       expect(res.body).to.be.empty; // eslint-disable-line no-unused-expressions
    //     })
    //     .end(done);
    // });
    //
    // it("fail getting non existent resource from a provider", function(done) {
    //   request("http://localhost:9999")
    //     .get("/providers/" + providerId + "/resources/notexists")
    //     .set("Accept", "application/json")
    //     .expect("Content-Type", "application/json; charset=utf-8")
    //     .expect(404, done);
    // });

  //   it("fail adding new resources on a provider due no data", function(done) {
  //     request("http://localhost:9999")
  //       .post("/providers/pid/resources")
  //       .set("Accept", "application/json")
  //       .expect("Content-Type", "application/json; charset=utf-8")
  //       .expect(400, done);
  //   });
  //
  //   it("fail adding new resources on a provider due no 'context'", function(done) {
  //     var resource = {
  //       context: "/res"
  //     }
  //     request("http://localhost:9999")
  //       .post("/providers/pid/resources")
  //       .set("Accept", "application/json")
  //       .send(resource)
  //       .expect("Content-Type", "application/json; charset=utf-8")
  //       .expect(400, done);
  //   });

  // });

  // describe("filters", function() {
  // });

});
