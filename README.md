# CAUTION !!!

At this moment clyde is simple a concept. It is unstable and in heavy development to implement a first core version.

![Clyde the orangutan](http://www.wweek.com/portland/imgs/media.images/18764/movies_everywhich.widea.jpg)

# Clyde

Based on [Kong](http://getkong.org/) and the requirements to protect a private API I started Clyde.

I choose Clyde name because it is, like Kong, the name of one of the most famous movie apes.

## Goals

A mediator between client and any number of private APIs. Clyde really receives the request, applies some filters (plugins), makes the resultant request to the private API and returns data to the client again.

Clyde can be used to makes accessible only some methods of the private API.

### Filters

A filter is any kind middleware, following the [connect](https://github.com/senchalabs/connect) language, that receives the `request`, `response` and `next` parameters.

By convention, all modules that implements filters, must provide an `init(name , config)` method, responsible to return the filter middleware. The received parameters are passed from the configuration JSON file and are the name and configuration of the filter.

* HMAC security.
* API KEY security.
* Rate limit.
* Transformers. The private API can have methods with parameters we don't want to make public. The goal of this filter is to translate a public parameter/s to the corresponding private parameter/s, for example, translate from a public `date` param to a private `initialDate/finalDate` parameters.
* Validators. Allows to limit the allowed requests, for example, supposing a `date` parameter we can limit the number of days we can query.
* Loggin/Monitoring.

### Concepts

* Producer: A private API we want to make public through Clyde.
* Consumer: An identified user who consumes the API. It is also possible to consume a public Clyde API without authentication.


Public API -> http://api.clyde.io

Private API 1 -> http://custom-api1
Private API 2 -> http://custom-api2

