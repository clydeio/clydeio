> Temporal documentation for the Barkley module

Beyond the technology, Clyde is all about configuring providers, filters, consumers, ... so each time a request arrives it know what to do: what conditions check, to what private API redirect, etc.

Barkley formalizes and defines all the concepts related to Clyde configurations and offers a tool so that filter developers can access configurations in an uniformly way.

Anyone can make a Barkley implementation, based on redis, mongodb, postgresql, ... while following the same interface (really, the same set of methods) and ensures the defined model is respected.

Barkley offers two things at a time:
- an API server (running at port 9999 by default), which offers to administrators a REST API to manage the Clyde configuration.
- a module, which implements the methods necessary to manage the configuration. This module is used by the previous API and also is passed to every filter so they can access the specific configurations.

This way, when Clyde is started two servers are run:
- The Clyde server (running at port 8080 by default): the main server listening for request and ensuring each one passes the configured rules.
- Barkley server (running at port 9999 by default): offers an REST API to manage Clyde configurations.

> Do not confuse the Barkley server, which is the REST API, with the Barkley module that really implements the set of methods to manage the configuration.


## Why the Barkley name?

The original name for the configuration manager module was *Butler* but after a nice > [suggestion](https://github.com/clydeio/clydeio/issues/24) from [@brylie](https://github.com/brylie) it was changed to [Barkley](http://modernfamily.wikia.com/wiki/Barkley), the Modern Family butler dog. I start Clyde project thinking on a famous orangutan, so it fair to name the configuration management module like another famous animal.

## Conceptual model

Next UML diagram show a representation of all the involved concepts:

![uml](http://yuml.me/4d2f640a)


> It was made with [yUML](http://yuml.me) service and here are the notation used:

```
[Configuration|id;description]
[Filter|id;name;description;config]
[Provider|id;target;description;context]
[Resource|id;path;description]
[FilterConsumer|config]

[Configuration]->*[Filter]
[Configuration]->*[Provider]
[Provider]->*[Filter]
[Provider]->*[Resource]
[Resource]->*[Filter]
[FilterConsumer]->1[Filter]
[FilterConsumer]->1[Consumer]
```

## Configuations

Barkley can manage many configurations, although only one can be the `active` configuration. Think, if you have ClydeIO working with a given configuration: what happens when you modify it attaching or detaching filters that are not fully configured? Your system will be in an inconsistent state.

Multiple configurations allows us to have a stable configuration, marked as the `active` one, while we can work on a second configuration adding or removing providers, changing properties, configuring filters and consumers, without affecting the production one.

In addition, allowing multiple configurations allows to deal with situations where we want to make a subtle change. For example, suppose you want to disable a provider, change the logging mode of a filter to debug it, or disable a consumer temporary.

Finally, multiple configurations allow us to maintain a history of configurations. If desired you can clone a configuration, make some changes and make it the active one. Later you can request the configuration and see the evolution of changes.

A configuration can have attached many prefilters and postfilters. Each time a request arrives to ClydeIO they are executed before and after the request is passed to the appropriate provider. The filters attached to a configuration are called *global filters* because the fact the are executed always.

## Providers

The goal of a configuration is to contains a set of configured providers. That is the mission of ClydeIO, proxy requests to a given private API.

Each provider represents a private API that works in a given `target` server. They handles the requests that match the given `context` path and are redirected to the specified `target` server. Each time a request match the `context` we say the request enters the *provider's context*. A provider can also have prefilters and postfilters and they are executed before and after the request is redirected to the target server. These filter are called *provider's filters* because are execute always a request enters a *provider's context*.

In some cases, we want to have a fine degree of control about the resources requested by consumers. Suppose we have a private API at `http://privateAPI.com` which allow to list orders resource `http://privateAPI.com/orders` and their users resource `http://privateAPI.com/users`. Suppose we have configured our ClydeIO server to catch all the request that starts with the context `/some_context` (the request would be something like `http://our.clydeio.server/some_context`) and be redirected to the private API at the target server `http://privateAPI.com`. Also we have attached to the provider a prefilter to log all the requested URLs in a log file.

That configuration offers great flexibility but, what if we want to have too different log files: one to store all the requests to the `/some_context/orders` and a second to log the requests to `/some_context/users`.

To solve this situations and offer a bit more of of flexibility ClydeIO allows to configure resources too. This way, a provider can have many resources, each one with its own `path` and its own prefilters and postfilters.

So, we have three levels where to apply filter: globally at the configuration level, for each configured provier and, finally, for each provider's resource.


TODO - Talk about filter, consumers and filter-consumers configurations.

## Operations

### Configurations

#### `[GET] /configurations`
Returns an array with all the available configuration (empty if there is no one configured). See `/configurations/{idConfiguration}` to see the `consumer` structure.

#### `[POST] /configurations`
Adds a new configuration. Operation expect next properties to create a new configuration entity:
  ```json
  {
   "name": "...",
   "description": "...."
  }
  ```
  Operation returns the new created configuration:
  ```json
  {
  "id": "...",
  "name": "...",
  "description": "...."
  }
  ```
  Errors:
  - `409` if another entity with the same `name` exists.

#### `[GET] /configurations/{idConfiguration}`
Returns the specified configuration:
  ```json
  {
    "id": "...",
    "name": "...",
    "description": "...."
  }
  ```
  Errors:
  - `404` if the entity not exists.

#### `[PUT] /configurations/{idConfiguration}`
Updates the configuration. Operation expects an object with the properties to be modified:
  ```json
  {
    "name": "...",
    "description": "...."
  }
  ```
  Operation returns the new updated configuration:
  ```json
  {
   "id": "...",
   "name": "...",
   "description": "...."
  }
  ```
  Errors:
  - `404` if the entity does not exists.
  - `409` if another entity with the same `name` exists.

#### `[DELETE] /configurations/{idConfiguration}`
Delete the given configuration. Operation returns the deleted configuration without `id` property:
  ```json
  {
   "name": "...",
   "description": "...."
  }
  ```
  Errors:
  - `404` if the entity does not exists.
  > Delete only removes the configuration entity. Attached filters and providers remains available to be used on other configurations.

- TODO `[GET] /configurations/active`: Get the active configuration
- TODO `[GET] /configurations/active/{idConfiguration}`: Make the specified configuration the active one.

#### Configuration's Filters

- `[GET] /configurations/{idConfiguration}/filters`: Return array of filters
- `[GET] /configurations/{idConfiguration}/filters/{idFilter}`:
- `[POST] /configurations/{idConfiguration}/filters/{idFilter}`: Attach
- `[DELETE] /configurations/{idConfiguration}/filters/{idFilter}`: Detach

#### Configuration's Providers

- `[GET] /configurations/{idConfiguration}/providers`: Return array of providers
- `[GET] /configurations/{idConfiguration}/providers/{idProvider}`:
- `[POST] /configurations/{idConfiguration}/providers/{idProvider}`: Attach
- `[DELETE] /configurations/{idConfiguration}/providers/{idProvider}`: Detach


---


### Consumers

#### `[GET] /consumers`
Returns an array with all the available consumers (empty if there is no one configured). See `/consumers/{idConsumer}` to see the `consumer` structure.

#### `[POST] /consumers`
Adds a new consumer. Operation expects next properties to create a `consumer` entity:
  ```json
  {
    "key": "...",
    "secret": "...."
  }
  ```
  Operation returns the new created consumer:
  ```json
  {
    "id": "...",
    "key": "...",
    "secret": "...."
  }
  ```
  Errors:
  - `409` if another entity with the same `key` exists.

#### `[GET] /consumers/{idConsumer}`
Returns the specified consumer:
  ```json
  {
    "id": "...",
    "key": "...",
    "secret": "...."
  }
  ```
  Errors:
  - `404` if the entity not exists.

  > TODO: Consumer structure must be better defined: do it need name, username, password, etc ???

#### `[PUT] /consumers/{idConsumer}`
Updates an existent consumer. Operation expects an object the consumer properties to be updated:
  ```json
  {
    "key": "...",
    "secret": "...."
  }
  ```
  Operations returns the updated consumer entity:
  ```json
  {
    "id": "...",
    "key": "...",
    "secret": "...."
  }
  ```
  Errors:
  - `404` if entity does not exists.
  - `409` if another entity with the same `key` exists.

#### `[DELETE] /consumers/{idConsumer}`
Deletes the specified consumer. Operations returns the deleted consumer entity without the `id` property:
  ```json
  {
    "key": "...",
    "secret": "...."
  }
  ```
  Errors:
  - `404` if entity not exists.
  > Note, delete a consumer implies all its related filters configurations are removed too.

#### Consumer's filters configuration

Consumers can have specific configurations applied on filters. Next operations allow to create, update or delete consumer's configurations attached to a given filter.

>Note, **removing a consumer implies remove all its configurations on any filter**.

##### `[GET] /consumers/{idConsumer}/consumerconfig`
Returns an array with all the specific filter configurations of consumers (empty if there is no one configured). See `/consumers/{idConsumer}/consumerconfig/{idConsumer}` to see the `consumerconfig` structure.

##### `[GET] /consumers/{idConsumer}/consumerconfig/{idConsumer}`
Returns the concrete configuration for a given consumer or 404 if the entity not exists:
  ```json
  {
    "idFilter": "...",
    "idConsumer": "...",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
	Errors:
	- `404` if the specified filter or consumer does not exists.

##### `[POST] /consumers/{idConsumer}/consumerconfig/{idConsumer}`
Adds a new specific consumer configuration to the filter. Operation expects need values to create a consumer config instance:
	```json
	{
		"config": {
			"param": "value",
			"...": "..."
		}
	}
	```
  Operation creates a new concrete consumer-filter configuration and returns the new created entity:
	```json
	{
		"idFilter": "...",
		"idConsumer": "...",
		"config": {
			"param": "value",
			"...": "..."
		}
	}
	```
  Errors:
	- `404` if the specified filter or consumer does not exists.
  - `409` if another configuration for the same filter and consumer exists.


##### `[PUT] /consumers/{idConsumer}/consumerconfig/{idConsumer}`
Modifies the configuration of the given consumer on the given filter. Operation expects an object with the properties to be updated:
	```json
	{
		"config": {
			"param": "value",
			"...": "..."
		}
	}
	```
	Operation creates a new concrete consumer-filter configuration and returns the new created entity:
	```json
	{
		"idFilter": "...",
		"idConsumer": "...",
		"config": {
			"param": "value",
			"...": "..."
		}
	}
	```
  Errors:
	- `400` if specified data is invalid.
	- `404` if the specified filter or consumer does not exists.


##### `[DELETE] /consumers/{idConsumer}/consumerconfig/{idConsumer}`
Deletes the specified filter-consumer configuration. Operation returns the `config` property of the deleted configuration:
  ```json
  {
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
	- `404` if the specified filter or consumer does not exists.


---


### Providers

Providers represents private APIs. For each provider you must specify a `target` server and a `context`, used to match each request and determine to which target server the request must be proxied to.


#### `[GET] /providers`
Returns an array of `providers` (empty if there is no one configured). See `/providers/{idProvider}` to see the `provider` structure.

#### `[POST] /providers`
Adds a new provider. Operation expects a `target` server value and a `context` that acts as the root context, which determines which requests are redirected to the target server::
  ```json
  {
		"description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Operation creates a new provider and its root context entity and returns the new created provider entity:
  ```json
  {
    "id": "...",
		"description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Errors:
	- `400` if parameters are invalids.
  - `409` if another entity with the same `context` exists.

#### `[GET] /providers/{idProvider}`
Returns the given provider:
  ```json
  {
    "id": "...",
		"description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Errors:
  - `404` if no entity found.

#### `[PUT] /providers/{idProvider}`
Updates an existent provider. Operation expects to pass an object with the properties to be updated:
  ```json
  {
		"description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Operation returns the updated provider entity:
  ```json
  {
    "id": "...",
		"description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Errors:
  - `404`, if entity provider does not exists.
  - `409`, if another entity with the same `target` or `context` in use exists.

#### `[DELETE] /providers/{idProvider}`
Deletes the specified provider deleting its related root context plus all its children contexts. Operation returns the deleted provider entity without the `id` property:
  ```json
  {
    "description": "....",
    "target": "http://...",
    "context": "/context"
  }
  ```
  Errors:
  - `404` if not exists.


#### Provider's Prefilters/Postfilters

##### `[GET] /providers/{idProvider}/[prefilters|postfilter]`
Returns all the prefilters/postfilters attached with the provider. See `/filters/{idFilter}` to see the filter entity structure.

##### `[GET] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`
Returns the specified filter attached with the provider:
  ```json
  {
    "id": "...",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified provider does not exists or the specified filter does not belongs to the filter.

##### `[POST] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`
Attach the specified filter to the provider. Does not return any data.
  Errors:
  - `404` if the specified provider or filter does not exists.

##### `[DELETE] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`
Detach the specified filter from the provider. Does not return any data.
  Errors:
  - `404` if the specified provider does not exists or the specified filter does not belongs to the filter.



#### Provider's Resources

##### `[GET] /providers/{idProvider}/resources`
Returns an array with all the configured resources. See `/providers/{idProvider}/resources/{idResource}` to see the `resource` entity.

##### `[POST] /providers/{idProvider}/resources`
Creates a new resource. Operation expects an object with the required properties:
  ```json
  {
  "path": "/resource_path",
	"description": "...."
  }
  ```
  Operation returns the new created resource:
  ```json
  {
    "id": "...",
    "path": "/resource_path",
		"description": "...."
  }
  ```

##### `[GET] /providers/{idProvider}/resources/{idResource}`
Returns the specified resource:
  ```json
  {
    "id": "...",
    "path": "/resource_path",
		"description": "...."
  }
  ```
  Errors:
  - `404` if the entity not exists.

##### `[PUT] /providers/{idProvider}/resources/{idResource}`
Updated the resources properties. Operations expects an object with the properties to be updated:
  ```json
  {
  "path": "/resource_path",
	"description": "...."
  }
  ```
  Operation returns the new created resource:
  ```json
  {
    "id": "...",
    "path": "/resource_path",
		"description": "...."
  }
  ```
  Errors:
  - `404` if the resource does not exists.

##### `[DELETE] /providers/{idProvider}/resources/{idResource}`
Deletes the specified resource. Operations returns the deleted resource without `id` property:
  ```json
  {
    "path": "/resource_path",
		"description": "...."
  }
  ```

##### Resource's Filters

###### `[GET] /providers/{idProvider}/resources/{idResource}/[prefilters|postfilter]`
Returns all the prefilters/postfilters attached with the resource. See `/filters/{idFilter}` to see the filter entity structure.

###### `[GET] /providers/{idProvider}/resources/{idResource}/[prefilters|postfilter]/{idFilter}`
Returns the specified filter attached with the resource:
  ```json
  {
    "id": "...",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified resource does not exists or the specified filter does not belongs to the resource.

###### `[POST] /providers/{idProvider}/resources/{idResource}/[prefilters|postfilter]/{idFilter}`
Attach the specified filter to the resource. Does not return data.
  Errors:
  - `404` if the specified resource or filter does not exists.

###### `[DELETE] /providers/{idProvider}/resources/{idResource}/[prefilters|postfilter]/{idFilter}`
Detach the specified filter from the resource. Does not return data.
  Errors:
  - `404` if the specified resource does not exists or the specified filter does not belongs to the resource.



---


<!-- #### Provider's Resources

##### `[GET] /providers/{idProvider}/resources`
- `[GET] /providers/{idProvider}/resources`: Returns all the resources attached to the provider. See `resources/{idResource}` to see the `resource` entity.

##### `[GET] /providers/{idProvider}/resources/{idResource}`
- `[GET] /providers/{idProvider}/resources/{idResource}`: Returns the specified resource:
  ```json
  {
    "id": "...",
		"description": "....",
    "path": "/resource_path"
  }
  ```
  Errors:
  - `404` if the entity not exists.

##### `[POST] /providers/{idProvider}/resources/{idResource}`
- `[POST] /providers/{idProvider}/resources/{idResource}`: Attach the given resource to the specified provider. Does not return any data.
  Errors:
  - `404` if the provider or resource does not exists.
  - `409` if the resources is attached to another provider.

##### `[DELETE] /providers/{idProvider}/resources/{idResource}`
- `[DELETE] /providers/{idProvider}/resources/{idResource}`: Detach the resource from the provider. Does not return any data.
  Errors:
  - `404` if the provider does not exists or the resource does not belongs to the provider.


--- -->


### Filters

#### `[GET] /filters`
Returns an array with all the configured filters (empty if there is no one configured). See `/filters/{idFilter}` to see the `filter` structure.

#### `[POST] /filters`
Adds a new filter. Operation expects need values to create a filter instance:
  ```json
  {
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
	> NOTE the `module` property must be the exact filter's module name. The `module` property is used to load the node module. It can be a global node's module (like `myFilter`), which means it will be loaded from the `node_modules` folder, or a relative path (like `./myFilter`), which means it will be loaded relative to the `filters` folder within the ClydeIO code folder.

  Operation creates a new filter and returns the new created filter entity:
  ```json
  {
    "id": "...",
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `409` if another entity with the same `name` exists.

#### `[GET] /filters/{idFilter}`
Returns the specified filter or 404 if the entity not exists:
  ```json
  {
    "id": "...",
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified entity does not exists.

#### `[PUT] /filters/{idFilter}`
Updates a filter. Operation expects an object with the properties to be updated:
  ```json
  {
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Operation returns the updated filter entity:
  ```json
  {
    "id": "...",
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified entity does not exists.
  - `409` if another entity with the same `name` exists.

#### `[DELETE] /filters/{idFilter}`
Deletes the specified filter. Operation returns the deleted filter without `id` property:
  ```json
  {
		"module": "node module path",
    "name": "filter name",
		"description": "....",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified entity does not exists.
  - `409` if the specified filter has consumer configurations attached to it.
> We can not delete filters that have consumer's configurations attached.

#### Filter's consumer configuration

Consumers can have specific configurations applied on each filter. Next operations allows to see those concrete consumer's configurations.

> To create, update are delete configurations see operations: `/consumers/{idConsumer}/consumerconfig`.

##### `[GET] /filters/{idFilter}/consumerconfig`
Returns an array with all the specific filter configurations of consumers (empty if there is no one configured). See `/filters/{idFilter}/consumerconfig/{idConsumer}` to see the `consumerconfig` structure.

##### `[GET] /filters/{idFilter}/consumerconfig/{idConsumer}`
Returns the concrete configuration for a given consumer or 404 if the entity not exists:
  ```json
  {
    "idFilter": "...",
    "idConsumer": "...",
    "config": {
      "param": "value",
      "...": "..."
    }
  }
  ```
  Errors:
  - `404` if the specified filter or consumer does not exists.
