> Temporal documentation for the Butler module

# Clyde Butler

Butler is the chief manager for Clyde's configuration.

The goal is to provide an interface of operations that can be implemented using any kind of backend: file, redis, mongodb, postgresql, ...

Bulter must be both:

- an API server that allows to play with configurations (for an admin user) and
- a module allows clyde and filter implementations to access and query configuration.

*Idea*: Allow to handle multiple configurations. While creating or updating configuration we leave it in an unstable state. For example, if we desire to have a provder with authentication we require to make two operations, first add the provider and later attach a authentication prefilter. Those the configuration is unstable until we attach the auth filter.


TODO - Review error codes and add 400 error in operations.


## Conceptual model

Next UML diagram show a representation of all the involved concepts:

![uml](http://yuml.me/4d2f640a)


> It was made with [yUML](http://yuml.me) service and here are the notation used:

```
[Configuration|id;description]
[Filter|id;name;description;config]
[Provider|id;target;description]
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

Butler can manage many configurations, although only one can be the `active` configuration. Think, if you have ClydeIO working with a given configuration: what happens when you modify it attaching or detaching filters that are not fully configured? Your system will be in an inconsistent state.

Multiple configurations allows us to have a stable configuration, marked as the `active` one, while we can work on a second configuration adding or removing providers, changing properties, configuring filters and consumers, without affecting the production one.

In addition allowing multiple configurations allows to deal with situations where we want to make a subtle change. For example, suppose you want to disable a provider, change the logging mode of a filter to debug it, or disable a consumer temporary.

Finally, multiple configurations allow us to maintain a history of configurations. If desired you can clone a configuration, make some changes and make it the active one. Later you can request the configuration and see the evolution of changes.

A configuration can have attached many prefilters and postfilters. Each time a request arrives to ClydeIO they are executed before and after the request is passed to the appropriate provider.

A configuration contains a set of providers. The providers handle the requests that match the given `context` and are redirected to the specified `target` server. A provider can also have prefilters and postfilters. They executed before and after the request is redirected to the target server.

In some cases, we want to have a great degree of control about the resources requested by consumers. Suppose we have a private API at `http://privateAPI.com` which allow to list orders resource `http://privateAPI.com/orders` and their users resource `http://privateAPI.com/users`. Suppose we have configured our ClydeIO server to catch all the request that starts with the context `/some_context` (the request would be something like `http://our.clydeio.server/some_context`) and be redirected to the private API at the target server `http://privateAPI.com`. Also we have attached to the provider a prefilter to log all the requested URLs in a log file.

That configuration offers great flexibility but, what if we want to have too different log files: one to store all the requests to the `/some_context/orders` and a second to log the requests to `/some_context/users`.

To solve this situations and offers a greater degree of flexibility ClydeIO allows to configure resources too. This way, a provider can have many resources, each one with its own `path` and its own prefilters and postfilters.




TODO - Talk about filter, consumers and filter-consumers configurations.

## Operations

<!-- TOC depth:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Clyde Butler](#clyde-butler)
	- [Conceptual model](#conceptual-model)
	- [Operations](#operations)
		- [Configurations](#configurations)
			- [`[GET] /configurations`](#get-configurations)
			- [`[POST] /configurations`](#post-configurations)
			- [`[GET] /configurations/{idConfiguration}`](#get-configurationsidconfiguration)
			- [`[PUT] /configurations/{idConfiguration}`](#put-configurationsidconfiguration)
			- [`[DELETE] /configurations/{idConfiguration}`](#delete-configurationsidconfiguration)
			- [Configuration's Filters](#configurations-filters)
			- [Configuration's Providers](#configurations-providers)
		- [Consumers](#consumers)
			- [`[GET] /consumers`](#get-consumers)
			- [`[POST] /consumers`](#post-consumers)
			- [`[GET] /consumers/{idConsumer}`](#get-consumersidconsumer)
			- [`[PUT] /consumers/{idConsumer}`](#put-consumersidconsumer)
			- [`[DELETE] /consumers/{idConsumer}`](#delete-consumersidconsumer)
		- [Providers](#providers)
			- [`[GET] /providers`](#get-providers)
			- [`[POST] /providers`](#post-providers)
			- [`[GET] /providers/{idProvider}`](#get-providersidprovider)
			- [`[PUT] /providers/{idProvider}`](#put-providersidprovider)
			- [`[DELETE] /providers/{idProvider}`](#delete-providersidprovider)
			- [Provider's Prefilters/Postfilters](#providers-prefilterspostfilters)
				- [`[GET] /providers/{idProvider}/[prefilters|postfilter]`](#get-providersidproviderprefilterspostfilter)
				- [`[GET] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`](#get-providersidproviderprefilterspostfilteridfilter)
				- [`[POST] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`](#post-providersidproviderprefilterspostfilteridfilter)
				- [`[DELETE] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`](#delete-providersidproviderprefilterspostfilteridfilter)
			- [Provider's Resources](#providers-resources)
				- [`[GET] /providers/{idProvider}/resources`](#get-providersidproviderresources)
				- [`[GET] /providers/{idProvider}/resources/{idResource}`](#get-providersidproviderresourcesidresource)
				- [`[POST] /providers/{idProvider}/resources/{idResource}`](#post-providersidproviderresourcesidresource)
				- [`[DELETE] /providers/{idProvider}/resources/{idResource}`](#delete-providersidproviderresourcesidresource)
		- [Filters](#filters)
			- [`[GET] /filters`](#get-filters)
			- [`[POST] /filters`](#post-filters)
			- [`[GET] /filters/{idFilter}`](#get-filtersidfilter)
			- [`[PUT] /filters/{idFilter}`](#put-filtersidfilter)
			- [`[DELETE] /filters/{idFilter}`](#delete-filtersidfilter)
			- [Filter's consumer configuration](#filters-consumer-configuration)
				- [`[GET] /filters/{idFilter}/consumerconfig/{idConsumer}`](#get-filtersidfilterconsumerconfigidconsumer)
		- [Resources](#resources)
			- [`[GET] /resources`](#get-resources)
			- [`[POST] /resources`](#post-resources)
			- [`[GET] /resources/{idResource}`](#get-resourcesidresource)
			- [`[PUT] /resources/{idResource}`](#put-resourcesidresource)
			- [`[DELETE] /resources/{idResource}`](#delete-resourcesidresource)
			- [Resource's Filters](#resources-filters)
				- [`[GET] /resources/{idResource}/[prefilters|postfilter]`](#get-resourcesidresourceprefilterspostfilter)
				- [`[GET] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`](#get-resourcesidresourceprefilterspostfilteridfilter)
				- [`[POST] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`](#post-resourcesidresourceprefilterspostfilteridfilter)
				- [`[DELETE] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`](#delete-resourcesidresourceprefilterspostfilteridfilter)
<!-- /TOC -->

### Configurations

#### `[GET] /configurations`
- `[GET] /configurations`: Returns an array with all the available configuration (empty if there is no one configured). See `/configurations/{idConfiguration}` to see the `consumer` structure.

#### `[POST] /configurations`
- `[POST] /configurations`: Adds a new configuration. Operation expect next properties to create a new configuration entity:
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
- `[GET] /configurations/{idConfiguration}`: Returns the specified configuration:
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
- `[PUT] /configurations/{idConfiguration}`: Updates the configuration. Operation expects an object with the properties to be modified:
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
- `[DELETE] /configurations/{idConfiguration}`: Delete the given configuration. Operation returns the deleted configuration without `id` property:
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
- `[GET] /consumers`: Returns an array with all the available consumers (empty if there is no one configured). See `/consumers/{idConsumer}` to see the `consumer` structure.

#### `[POST] /consumers`
- `[POST] /consumers`: Adds a new consumer. Operation expects next properties to create a `consumer` entity:
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
- `[GET] /consumers/{idConsumer}`: Returns the specified consumer:
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
- `[PUT] /consumers/{idConsumer}`: Updates an existent consumer. Operation expects an object the consumer properties to be updated:
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
- `[DELETE] /consumers/{idConsumer}`: Deletes the specified consumer. Operations returns the deleted consumer entity without the `id` property:
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
- `[GET] /consumers/{idConsumer}/consumerconfig`: Returns an array with all the specific filter configurations of consumers (empty if there is no one configured). See `/consumers/{idConsumer}/consumerconfig/{idConsumer}` to see the `consumerconfig` structure.

##### `[GET] /consumers/{idConsumer}/consumerconfig/{idConsumer}`
- `[GET] /consumers/{idConsumer}/consumerconfig/{idConsumer}`: Returns the concrete configuration for a given consumer or 404 if the entity not exists:
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
- `[POST] /consumers/{idConsumer}/consumerconfig/{idConsumer}`: Adds a new specific consumer configuration to the filter. Operation expects need values to create a consumer config instance:
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
- `[PUT] /consumers/{idConsumer}/consumerconfig/{idConsumer}`: Modifies the configuration of the given consumer on the given filter. Operation expects an object with the properties to be updated:
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
- `[DELETE] /consumers/{idConsumer}/consumerconfig/{idConsumer}`: Deletes the specified filter-consumer configuration. Operation returns the `config` property of the deleted configuration:
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

#### `[GET] /providers`
- `[GET] /providers`: Returns an array of `providers` (empty if there is no one configured). See `/providers/{idProvider}` to see the `provider` structure.

#### `[POST] /providers`
- `[POST] /providers`: Adds a new provider. Operation expects a `target` server value and a `context` that acts as the root context, which determines which requests are redirected to the target server::
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
  - `409` if another entity with the same `target` exists or the specified root context `context` is used by another provider.

#### `[GET] /providers/{idProvider}`
- `[GET] /providers/{idProvider}`: Returns the given provider:
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
* `[PUT] /providers/{idProvider}`: Updates an existent provider. Operation expects to pass an object with the properties to be updated:
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
- `[DELETE] /providers/{idProvider}`: Deletes the specified provider deleting its related root context plus all its children contexts. Operation returns the deleted provider entity without the `id` property:
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
- `[GET] /providers/{idProvider}/[prefilters|postfilter]`: Returns all the prefilters/postfilters attached with the provider. See `/filters/{idFilter}` to see the filter entity structure.

##### `[GET] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`
- `[GET] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`: Returns the specified filter attached with the provider:
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
- `[POST] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`: Attach the specified filter to the provider. Does not return any data.
  Errors:
  - `404` if the specified provider or filter does not exists.

##### `[DELETE] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`
- `[DELETE] /providers/{idProvider}/[prefilters|postfilter]/{idFilter}`: Detach the specified filter from the provider. Does not return any data.
  Errors:
  - `404` if the specified provider does not exists or the specified filter does not belongs to the filter.


#### Provider's Resources

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


---


### Filters

#### `[GET] /filters`
- `[GET] /filters`: Returns an array with all the configured filters (empty if there is no one configured). See `/filters/{idFilter}` to see the `filter` structure.

#### `[POST] /filters`
- `[POST] /filters`: Adds a new filter. Operation expects need values to create a filter instance:
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
- `[GET] /filters/{idFilter}`: Returns the specified filter or 404 if the entity not exists:
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
- `[PUT] /filters/{idFilter}`: Updates a filter. Operation expects an object with the properties to be updated:
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
- `[DELETE] /filters/{idFilter}`: Deletes the specified filter. Operation returns the deleted filter without `id` property:
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
- `[GET] /filters/{idFilter}/consumerconfig`: Returns an array with all the specific filter configurations of consumers (empty if there is no one configured). See `/filters/{idFilter}/consumerconfig/{idConsumer}` to see the `consumerconfig` structure.

##### `[GET] /filters/{idFilter}/consumerconfig/{idConsumer}`
- `[GET] /filters/{idFilter}/consumerconfig/{idConsumer}`: Returns the concrete configuration for a given consumer or 404 if the entity not exists:
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


---


### Resources

> Note, it is allowed to have more than one resource with the same `path` value. Simply remember a resource can only be used with one provider. If two providers can have the same resource you need to create two different resources with the same path and configure with its own filters.

#### `[GET] /resources`
- `[GET] /resources`: Returns an array with all the configured resources. See `/resources/{idResource}` to see the `resource` entity.

#### `[POST] /resources`
- `[POST] /resources`: Creates a new resource. Operation expects an object with the required properties:
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

#### `[GET] /resources/{idResource}`
- `[GET] /resources/{idResource}`: Returns the specified resource:
  ```json
  {
    "id": "...",
    "path": "/resource_path",
		"description": "...."
  }
  ```
  Errors:
  - `404` if the entity not exists.

#### `[PUT] /resources/{idResource}`
- `[PUT] /resources/{idResource}`: Updated the resources properties. Operations expects an object with the properties to be updated:
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

#### `[DELETE] /resources/{idResource}`
- `[DELETE] /resources/{idResource}`: Deletes the specified resource. Operations returns the deleted resource without `id` property:
  ```json
  {
    "path": "/resource_path",
		"description": "...."
  }
  ```

#### Resource's Filters

##### `[GET] /resources/{idResource}/[prefilters|postfilter]`
- `[GET] /resources/{idResource}/[prefilters|postfilter]`: Returns all the prefilters/postfilters attached with the resource. See `/filters/{idFilter}` to see the filter entity structure.

##### `[GET] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`
- `[GET] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`: Returns the specified filter attached with the resource:
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

##### `[POST] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`
- `[POST] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`: Attach the specified filter to the resource. Does not return data.
  Errors:
  - `404` if the specified resource or filter does not exists.

##### `[DELETE] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`
- `[DELETE] /resources/{idResource}/[prefilters|postfilter]/{idFilter}`: Detach the specified filter from the resource. Does not return data.
  Errors:
  - `404` if the specified resource does not exists or the specified filter does not belongs to the resource.
