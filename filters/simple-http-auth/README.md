# Simple HTTP Authentication

A simple authentication filter for basic and digest methods. It is based on [passport-http](https://github.com/jaredhanson/passport-http) module.


## Configuration

Accepts the configuration properties:

* `realm`: A string that identifies the authentication realm.
* `method`: Indicates the authenticated method to be used. It is a required property. Allowed values are `basic` and `digest`.
* `consumers`: An object with the list of `user,password` pairs for each user.


## Examples

### Configured as global prefilter

All requests are authenticated using basic auth:

```javascript
{
  "prefilters" : [
    {
      "id" : "basic-auth",
      "path" : "./filters/simple-http-auth",
      "config" : {
        "realm" : "clyde",
        "method" : "basic",
        "consumers" : {
          "userA" : "passwordA",
          ...
        }
      }
    }
    ...
  ]
}
```

### Configured as provider prefilter

Only the requests addresses to the provider are authenticated with digest method:

```javascript
{
  "providers" : [
    {
      "id" : "some_provider",
      "context" : "/some_provider",
      "target" : "http://some_server",
      "prefilters" : [
        {
          "id" : "digest-auth",
          "path" : "./filters/simple-http-auth",
          "config" : {
            "realm" : "clyde",
            "method" : "digest",
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
```


## Notes:

* It has no sense configure an authentication filter as a global or provider's postfilter.
