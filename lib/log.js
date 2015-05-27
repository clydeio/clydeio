"use strict";

var bunyan = require('bunyan');

var log = bunyan.createLogger({
  name: 'clyde',
  streams: [
    {
      level: 'trace',
      stream: process.stdout
    }
  ],
  serializers: bunyan.stdSerializers
});

module.exports = log;
