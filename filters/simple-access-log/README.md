# Simple Access log

A [morgan](https://github.com/expressjs/morgan) based logger which stores 
information into a log file for each request access.


## Configuration

Accepts the configuration properties:

* `file`: The file where to store log information.
* `directory`: The folder where to store log files.


## Examples

### Configured as global prefilter

All request to any provider will be stored:

    {
      "prefilters" : [
        {
          "name" : "logger",
          "path" : "./filters/simple-access-log",
          "config" : {
            "directory" : "./tmp/log",
            "file" : "global-access-%DATE%.log"
          }
        }
        ...
      ]
    }

### Configured as provider prefilter

Only the requests addresses to the provider will be stored

    {
      "providers" : [
        {
          "context" : "/some_provider",
          "name" : "some_provider",
          "target" : "http://some_server",
          "prefilters" : [
            {
              "name" : "logger",
              "path" : "./filters/simple-access-log",
              "config" : {
                "directory" : "./tmp/log",
                "file" : "some_provder-access-%DATE%.log"
              }
            }
        },
        ...
      ]
    }


## Notes:

* As a postfilter it is only invoked for success responses.
