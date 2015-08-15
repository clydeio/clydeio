# Introducing Clyde

> **Note:** Impressed by the [Kong](http://getkong.org/) project and by the need to protect a private API I started *Clyde* project. I choose Clyde name because it is, like Kong, the name of one of the most famous movie apes.

Clyde is an API gateway, which means it receives requests and redirects to the right API implementation meanwhile applies any number of so called *filter* before and/or after redirecting the request.

![Clyde](doc/img/clyde.png)

The power of Clyde resides in the way it manages the filters, making it extremely modular and configurable.

In addition, Clyde filters are really easy to extend so anyone can implement its own filters to satisfy their needs.

## Concepts

Let's go to describe briefly the set of buzzwords related to Clyde:

### Provider (or Private API)

By *provider* or *private API* we mean a well implemented API which is not ready to be wide open publicly.

For example, a company can have an API implementing its business operations but lacks from authentication, logging, rate limiting, etc.

### Public API

A public API is a wide open accessible API.

Clyde acts as a public API gateway receiving requests and redirecting to the corresponding provider (private API).

### Consumer

A consumer is any client who access resources from an exposed provider, that is, that consumes an API.

### Filter

Filters are a piece of software executed before and/or after a request is redirected to a provider and that can modify the `request` and `response` objects

> Note, a filter is nothing more than a *middleware* function. Clyde core and also many of its filters are implemented using the [connect](https://github.com/senchalabs/connect) project, so the concept of middleware is inherited from it.

Filters can be classified depending on the moment Clyde executes them, that is, before (*pre*) or after (*post*) request is proxied to the provider:

* **prefilters**: Those filters designed to be executed before Clyde proxies the request to the provider (the private API) and allow to manipulate the request: checking headers, changing query parameters, log request, etc.

* **postfilters**: Filters designed to be executed after Clyde proxies the request to the provider (the private API) and allow to manipulate the response: adding headers, removing data, etc.

Clyde gives flexibility enough to configure filter to be executed globally, per provider or per provider's resource. We can classify them as:

* **global pre/postfilter**: filters applied outside the so called *providers configuration zone* and affect any request.

* **provider pre/postfilter**: filters applied inside the so called *providers configuratin zone* and only affect those request on a given provider.

* **resource pre/postfilter**: filters applied on a given provider's resource, in the way, they only affect those requests addressed to a given resource of a provider.

## The data flow

The next figure summarizes the steps a request follows each time arrives to Clyde gateway.

![The big picture](doc/img/dataflow.png)

* Request passes through each *global prefilter* in the same order they are configured.
* Request is redirected to the right provider and enters the *providers configuration zone*.
* Request passes through each *provider's prefilter* in the same order they are configured.
* If the request matches any *provider's resource* the resource prefilters are applied.
* Request is proxied to the private API.
* If the request matches any *provider's resource* the resource postfilters are applied.
* Request passes through each *provider's postfilter* in the same order they are configured.
* Request passes through each *global postfilter* in the same order they are configured.

As we can see, working with global/provider/resource prefilter/postfilters give us maximum flexibility to implement any possible configuration.

Note a filter is designed to make an action and it is up to you decide at which place to execute. This way, we can configure two filters, of the same type  but with different options, and execute them at different places. For example, one *access log* filter as global prefilter to log all requests (no matter the provider) and another *access log*  filter executed as a provider's prefilter to log only the requests addressed to that concrete provider.


## Conventions

You are free to implement custom filters following your own rules but, as many times, conventions are a good thing so everybody can work following the same patterns.

### Provider

Some plugins, like a *rate limiter*, could be flexible enough to be applied on a given provider. For example, we can limit the number of requests/second a provider can reveice, that is, the number of request/seconf Clyde can redirect to a provider.

To achieve this, the filter needs to know a bit about the provider the request is addressed. For this purpose, each time a request enters in the *provider configuration zone* (see picture) a new property `provider` is set within the middleware's `request` object.

![Provider's config](doc/img/provider_config.png)

The `req.provider` object contains at least the next properties:

```javascript
req.provider = {
  providerId: 'some unique value',
  context: '/some/context',
  target: 'http://some_server:port'
};
```

This way, any filter that makes actions depending on the provider information can use the `req.provider` property to know about it.

### Authentication

In the same way and, continue using a supposed *rate limiter* filter, it could be flexible enough to limit the request/second a user, that is a consumer, can make on a given provider.

Clyde follows the convention that **any module that authenticates consumers (the users) must add a `user` object to the `request` object**:

![Authentication config](doc/img/auth_config.png)

The `req.user` object must contains at least a property `userId`:

```javascript
req.user = {
  userId: 'some value',
  ...
};
```

This way, any subsequent filter that wants to make actions depending on the consumer can use `req.user.userId` to know the current user.

> Some authentication filters uses the [passport](https://github.com/jaredhanson/passport) module, which adds `req.user` to the request. We simply follow the same convention.


## Creating custom filters

Create new filters is extremely simple (and more if you are a NodeJS developer with some experience using *connect* or *express*).

A filter requires to create a module that exports an `init(name , config)` method responsible to return a middleware function:

```javascript
/**
 + My custom filter.
 +
 + @param  {String} id Identifier of the filter
 + @param  {Object} config JavaScript object with filter configuration
 + @returns {middleware} Middleware function implementing the filter.
 */
module.exports.init = function(id, config) {
    return function(req, res, next) {
        // Do whatever. I'm a filter !!!
    };
};
```

The `init()` method receives the `name` of the filter we have used in the configuration and the `configuration` options we have specified. It is up to you do whatever with the filter configuration and middleware.
