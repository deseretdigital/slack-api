const tracer = require("dd-trace");
tracer.init({
  env: "prod",
  service: "optimizely-api",
  version: "1",
  logInjection: true
}); // initialized in a different file to avoid hoisting.
module.exports = tracer;
