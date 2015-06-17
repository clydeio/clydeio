/* eslint no-unused-vars:0, no-unused-expressions:0 */
"use strict";

var path = require("path");
var expect = require("chai").expect;
var config = require("./fixtures/config-hmac-auth.json");
var http = require("http");
var clyde = require("../lib/clyde");
var request = require("supertest");
var Hmmac = require("hmmac");
var hmmac = new Hmmac({ scheme: Hmmac.schemes.load("plain") });

describe("simple-hamc-auth", function() {

  var server;

  before(function(done) {
    var clydeProxy = clyde.createProxyServer(config);
    server = http.createServer(clydeProxy);
    server.listen(8888);

    server.on("listening", function() {
      done();
    });
  });


  after(function(done){
    server.close();
    done();
  });


  it("should due invalid hmac authentication", function(done) {
    var payload = 'hi, this is the BODY';
    var httpRequest = {
      host: 'localhost',
      port: 8888,
      path: '/fuckyeah',
      method: 'GET',
      headers: {
        'x-auth-signedheaders': "host; content-type; date",
        'Content-Type': 'text/plain',
        'Date': new Date().toUTCString()
      }
    };
    hmmac.sign(httpRequest, {key: "keyA", secret: "secretA"});
    var req = http.request(httpRequest, function(res) {
      if (res.statusCode === 200) {
        console.log('Success!');
        done();
      }
      else {
        console.log(res.statusCode, res.headers);
        throw new Error("Unauthorized");
      }

      process.exit();
    });

    req.write(payload);
    req.end();
  });


});
