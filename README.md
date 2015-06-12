# CAUTION !!!

Currently clyde is a proof of concept. It is unstable and in heavy development process to implement a first core version.

![Clyde the orangutan](http://www.wweek.com/portland/imgs/media.images/18764/movies_everywhich.widea.jpg)

# Clyde

> **Note:** Impressed by the [Kong](http://getkong.org/) project and by the need to protect a private API I started *Clyde* project. I choose the Clyde name because it is, like Kong, the name of one of the most famous movie apes.

When developing a business API the most important part resides on designing the operations and the logic implementation. This is true but many times, in real life projects, we also need to make the API public introducing a new set of challenges like allowing authentication, log requests, control rate limiting, etc.

The goal of Clyde is to simplify our live, allowing us to concentrate on the implementation of our API business logic and leaving the rest to Clyde.

Clyde acts as a mediator (a man in the middle or a proxy) that allows to communicate the external clients, the **consumers** with any number of private APIs, the **providers**.

Clyde is extremely configurable and allows process the request from consumers to providers and the responses from the providers to the consumers.

The core of Clyde is responsible to read the configuration, load the required filters and connect them to be executed in the desired order. The real job is done by each filter: rate limiting, authentication, logging, etc.

## Filters

A filter is any kind *middleware*, following the [connect](https://github.com/senchalabs/connect) language, that receives the `request`, `response` and `next` parameters. In fact, Clyde (and some of its basic filters) is implemented using [connect](https://github.com/senchalabs/connect) project.

Create new filters is extremely simple for a NodeJS developer. We simply need to create a module that exports an `init(name , config)` method resposible to return a middleware function:

    /**
     - My custom filter.
     - 
     - @param  {String} name Name of the filter
     - @param  {object} config JavaScript object with filter configuration
     - @returns {middleware} Middleware function implementing the filter.
     */
    module.exports.init = function(name, config) {
        return function(req, res, next) {
            // Do whatever
        };
    };

The `init()` method receives the `name` of the filter we have used in the configuration and the `configuration` options we have specified. It is up to you do whatever with the filter configuration and middleware.


### Filters proposal

* HMAC security.
* API KEY security.
* Rate limit.
* Transformers. The private API can have methods with parameters we don't want to make public. The goal of this filter is to translate a public parameter/s to the corresponding private parameter/s, for example, translate from a public `date` param to a private `initialDate/finalDate` parameters.
* Validators. Allows to limit the allowed requests, for example, supposing a `date` parameter we can limit the number of days we can query.
* Loggin/Monitoring.

## Concepts

* Producer: A private API we want to make public through Clyde.
* Consumer: An identified client who consumes the API. It is also possible to consume a public Clyde API without authentication.

