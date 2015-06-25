# CAUTION !!!

Currently clyde is a proof of concept. It is unstable and in heavy development process to implement a first core version.

![Clyde the orangutan](http://www.wweek.com/portland/imgs/media.images/18764/movies_everywhich.widea.jpg)

# Clyde

> **Note:** Impressed by the [Kong](http://getkong.org/) project and by the need to protect a private API I started *Clyde* project. I choose the Clyde name because it is, like Kong, the name of one of the most famous movie apes.

When developing a business API the most important part resides on designing the operations and the logic implementation. This is true but many times, in real life projects, we also need to make the API public introducing a new set of challenges like allowing authentication, log requests, control rate limiting, etc.

The goal of Clyde is to simplify our live, allowing us to concentrate on the implementation of our API business logic and leaving the rest to Clyde.

![Clyde](doc/clyde.png)

Clyde acts as a mediator (a man in the middle or a proxy) that allows to communicate the external clients, the **consumers**, with any number of private APIs, the **providers**. It allows to process the requests from consumers to providers and the responses from the providers to the consumers.

Clyde is modular and extremely configurable. Its core is responsible to read the configuration, load the required filters and connect them to be executed in the desired order. The real job is done by each filter: rate limiting, authentication, logging, etc.


## Filters, Providers and Consumers

Clyde is based on three main concepts: filters, providers and consumers.

* **Producer**: A producer designates a private API we want to make public through Clyde. 

* **Consumer**: A consumer is an identified client who consumes resources from an exposed provider, that is, that consumes an API.

* **Filter**: A filter is any kind *middleware* function that receives three parameters: the `request`, the `response` and a `next` function. 

Clyde core (and also many filters) is implemented using the [connect](https://github.com/senchalabs/connect) project, so the concept of middleware was inherited from it.

Within filters we can found two kind of filters: *prefilter* and *postfilters*.

* **prefilters**: Those filters designed to be executed before Clyde proxies the request to the provider (the private API) and allow to manipulate the request: checking headers, changing query parameters, log request, etc.

* **postfilters**: Filters designed to be executed after Clyde proxies the request to the provider (the private API) and allow to manipulate the response: adding headers, removing data, etc.


## The data flow

The sequence of actions is explained in the next figure and goes as follows: 

* Each request passes a set of so called *global prefilters*, that is prefilters applied to every request no matter what provider they are addressed to.
* Given the *context* specified, the request is addressed to a provider.
    * Before sent to the provider, the request passes a set of *provider's prefilters*.
    * The request is proxied to the provider.
    * After sent to the provider, the response passes a set of *provider's postfilters*.
* Finally, the response passes a set of *global postfilters*.

![The big picture](doc/dataflow.png)

This sequence allows maximum flexibility. The same filter can be set as global prefilter, provider's prefilter or global postfilter. It is up to you and, the possibilities of the filter, where to configure to be executed.


## Authentication

You are free to implement custom filters following your own rules but, as many times, conventions are a good thing so everybody can work following the same patterns.

Plugins, like the *rate limiter* are flexible enough to be applied globally or specifically to limit the access of a given customer on a given provider. To achieve this, the filter need to know the provider the request is addressed and the consumer is making the request.

For this purpose, each time a request arrives to a *provider configuration zone* (see picture) a new property `provider` is set within the middleware's `request` object with the *context* of the provider as value. Provider's context must be unique, so it is a good value to be used. This way, any filter that makes actions depending on the provider can use the `req.provider` property to know the provider.

![Provider's config](doc/provider_config.png)

On the other hand and, as a convention, any module that authenticates users (the consumers) must add a `user` object to the `request` object with a property `userId`. This way, any subsequent filter that wants to make actions depending on the consumer can use `req.user.userId` to know the current user.


## Custom filters

Create new filters is extremely simple (and most if you are a NodeJS developer with experience on *connect* or *express*). We simply need to create a module that exports an `init(name , config)` method responsible to return a middleware function:

    /**
     * My custom filter.
     * 
     * @param  {String} name Name of the filter
     * @param  {object} config JavaScript object with filter configuration
     * @returns {middleware} Middleware function implementing the filter.
     */
    module.exports.init = function(name, config) {
        return function(req, res, next) {
            // Do whatever
        };
    };

The `init()` method receives the `name` of the filter we have used in the configuration and the `configuration` options we have specified. It is up to you do whatever with the filter configuration and middleware.


## Available filters

* [Simple Access Log](filters/simple-access-log/). Stores request access information (like any HTTP server).
* [Simple Rate limit](filters/simple-rate-limit/). Limits access globally, by consumer or by providers.
* [Simple HMAC Authentication](filters/simple-hmac-auth/). Authenticates consumers following HMAC security scheme.
* [Simple HTTP authentication](filters/simple-http-auth/). Authenticates consumers using basic or digest authentication methods.


## Filters proposal

* API KEY security.
* Transformers. The private API can have methods with parameters we don't want to make public. The goal of this filter is to translate a public parameter/s to the corresponding private parameter/s, for example, translate from a public `date` param to a private `initialDate/finalDate` parameters.
* Validators. Allows to limit the allowed requests, for example, supposing a `date` parameter we can limit the number of days we can query.
* CORS filter. Allow access data from AJAX clients.
* JSONP. Adapt responses to JSONP.


# License

The MIT License (MIT)

Copyright (c) 2015 Antonio Santiago (@acanimal)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


