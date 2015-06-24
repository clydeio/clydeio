# Simple Rate Limit

A basic rate limiter implementation filter based on [limiter](https://github.com/jhurliman/node-rate-limiter) module.

This filter is extremely flexible and allows limit:
* Global access to the Clyde server.
* Global access by a given consumer.
* Access to a given provider.
* Access to a given provider by a given consumer.
* or chain all the previous limitations.

## Configuration

Accepts the configuration properties:

* `global`: Specifies the limits to be applied globally. It must be an object with the properties:
  - `tokens`: Number of allowed access
  - `interval`: Interval within the previous accesses are allowed. Allowed values are: `sec/second`, `min/minute`, `hr/hour` and `day`. 

* `consumers`: Specifies the global limits per consumers. For each consumer and object with `tokens` and `interval` properties must be specified.

* `providers`: Specifies the limits for each providers. It must be an object with the properties:
  - `global`: Indicates limits applied to the provider (no matter which consumer).
  - `consumers`: Indicates the limits per consumer.

At least one property must be specified, that is, at least `global`, `consumers` or `providers` must be set.


## Examples

### Limit global access to 100 req/sec

    {
      "prefilters" : [
        {
          "name" : "rate-limit",
          "path" : "./filters/simple-rate-limit",
          "config" : {
            "global" : {
              "tokens" : 100,
              "interval" : "second"
            },
            ...
          }
        }
        ...
      ]
    }

### Limit access to a provider to 100 req/sec

    {
      "prefilters" : [
        {
          "name" : "rate-limit",
          "path" : "./filters/simple-rate-limit",
          "config" : {
            "providers" : {
              "/some_provider" : {
                "global" : {
                  "tokens" : 100,
                  "interval" : "second"
                }
              },
              ...
            },
            ...
          }
        }
        ...
      ]
    }


### Limit access to a provider to 100 req/sec and to the `userA` consumer rate limited to 20 req/sec

    {
      "prefilters" : [
        {
          "name" : "rate-limit",
          "path" : "./filters/simple-rate-limit",
          "config" : {
            "providers" : {
              "/some_provider" : {
                "global" : {
                  "tokens" : 100,
                  "interval" : "second"
                },
                "consumers" : {
                  "userA" : {
                    "tokens" : 20,
                    "interval" : "second"
                  }
                } 
              },
              ...
            },
            ...
          }
        }
        ...
      ]
    }

## Notes:

* It has no sense configure the rate limiter filter as a global or provider's postfilter.
* Limits are applied in the order: global, consumers and providers. Be aware when chaining limits.
