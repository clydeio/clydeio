/**
 * Fake server implementation for testing.
 *
 * This script creates two servers, listening at ports 8890 and 8891, that acts 
 * as two different APIs providers for Clyde testing.
 * 
 */

var restify = require('restify');


// Create server and define actions
var serverA = restify.createServer({
  name: "FakeServerA"
});

serverA.get("/operationA", function respond(req, res, next) {
  res.setHeader("content-type", "text/plain");
  res.send("hello from ProviderA");
  next();
});

// Start fake server
serverA.listen(8890, function() {
  console.log("'%s' listening at '%s'...", serverA.name, serverA.url);
});


// Create server and define actions
var serverB = restify.createServer({
  name: "FakeServerB"
});

serverB.get("/operationB", function respond(req, res, next) {
  res.setHeader("content-type", "text/plain");
  res.send("hello from ProviderB");
  next();
});

// Start fake server
serverB.listen(8891, function() {
  console.log("'%s' listening at '%s'...", serverB.name, serverB.url);
});
