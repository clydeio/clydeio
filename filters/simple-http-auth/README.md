# Simple Basic Authentication

A basic authentication filter based on [passport-http](https://github.com/jaredhanson/passport-http) module.


## Configuration

Accepts the configuration properties:

* `realm`: A string that identified the authentication realm.
* `consumers`: An object with the list of `user,password` pairs for each user.


## Examples

### Configured as global prefilter

All request to any provider will be stored:

    {
      "prefilters" : [
        {
          "name" : "hmac-auth",
          "path" : "./filters/simple-hmac-auth",
          "config" : {
            "realm" : "clyde",
            "consumers" : {
              "userA" : "passwordA",
              ...
            }
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
              "name" : "hmac-auth",
              "path" : "./filters/simple-hmac-auth",
              "config" : {
                "realm" : "clyde",
                "consumers" : {
                  "userA" : "passwordA",
                  ...
                }
              }
            }
        },
        ...
      ]
    }


## Notes:

* It has no sense configure an authentication filter as a global or provider's postfilter.
