
# Available filters

* [Simple Access Log](https://github.com/clydeio/clyde-simple-access-log). Stores request access information (like any HTTP server).
* [Simple Rate Limit](https://github.com/clydeio/clyde-simple-rate-limiter). Limits access globally, by consumer or by providers.
* [Simple HMAC Authentication](https://github.com/clydeio/clyde-hmac-auth). Authenticates consumers following HMAC security scheme.
* [Simple HTTP Authentication](https://github.com/clydeio/clyde-simple-http-auth). Authenticates consumers using basic or digest authentication methods.
* [CORS](https://github.com/clydeio/clyde-cors). Enables Cross Origin Resource Sharing (CORS) whic allows AJAX requests.
* [Request Size Limit](https://github.com/clydeio/clyde-request-size-limiter). Block requests depending on its body length.


## Filters proposal

* API KEY security.
* Transformers. The private API can have methods with parameters we don't want to make public. The goal of this filter is to translate a public parameter/s to the corresponding private parameter/s, for example, translate from a public `date` param to a private `initialDate/finalDate` parameters.
* Validators. Allows to limit the allowed requests, for example, supposing a `date` parameter we can limit the number of days we can query.
* JSONP. Adapt responses to JSONP.
