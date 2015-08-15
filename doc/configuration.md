
# Configuration

The goal of the configuration options is to define the flow data must follow through the global prefilters, the provider's confiruation zone and the global postfilters.

As standalone application Clyde requires specify the configuration in a JSON file. As a connection listener it requires a JavaScript object. In both cases the allower structure and properties are the same.

The configuration options are:

* `prefilters`: An array of *filter objects* that will be executed as global prefilters. Optional property.
* `postfilters`: An array of *filter objects* that will be executed as global postfilters. Optional property.
* `providers`: An array of *provider objects* with the configuration need to route a request to approppriate private API. It is the only mandatory property and must contain at least one provider configuration.
* `logfile`: Path to the log file. Optional property. Default 'clyde.log'.
* `loglevel`: Level used for clyde log messages. Optional property. Default 'info'.

> As standalone application, `logfile` and `loglevel` can be specified on command line. In that case command line values override values specified in the configuration file.

## Filter object

A filter object contains information need so Clyde can load and execute a given filter. The allowed properties are:

* `id`: String identifying the filter among all other filters. It is a mandatory property.
* `path`: Path need to load the filter module. It is a mandatory property. Modules are loaded using `require()`. Paths starting with a dot `.` will be loaded relatively to the `$CLYDE/filters` directory. Otherwise modules are loaded following node rules. For example: `path: "some_filter"` will try to load the module from the `node_modules` directory.
* `config`: An object with the filter configuration properties. The allowed properties depends on each filter. Optional property.

> When filters are initialized, `id` and `config` properties are passed to the filter's exported method `init(id, config)`.

## Provider object

For each private API we desire to make publicly available we must configure a provider object. The allowed properties are:

* `id`: String identifying the provider among all other providers. It is a mandatory property.
* `context`: The path part (from the beginning) that is used to discriminate the private API we want to route the request.
* `target`: The address where to proxy the requests that follows the previous `context`.
* `prefilters`: An array of *filter objects* that will be executed as global prefilters. Optional property.
* `postfilters`: An array of *filter objects* that will be executed as global postfilters. Optional property.
* `resources`: An array of *resource objects* that will be executed depending on its `context` property.

## Resource object

A resource represents a concrete resource or operation within a private API. We can use it to specify concrete filters to be applied per resource.

* `id`: String identifying the resource among all provier's resources. It is a mandatory property.
* `context`: The path part (after the provider's `context`) that is used to discriminate the resource of the private API we want to apply filers.
* `prefilters`: An array of *filter objects* that will be executed on the resource. Optional property.
* `postfilters`: An array of *filter objects* that will be executed on the resource. Optional property.

## Configuration example

Next we show a sample JSON configuration that allows Clyde to redirect request to two private APIs, which resides at `http://providerA:8080` and `http://providerB:8080`.

Clyde is working with `loglevel` at `debug` level, which means we will see messages each time a request enters or exits a filter or is redirected to a provider.

A global prefilter is configured to log each request that arrives to Clyde server, which are stored at `./tmp/log` directory following the pattern `access-%DATE%.log`.

All the requests that follows the patter `http://clyde_server/A/*` are redirected to the *providerA*. In addition this provider has configured a CORS filters, which allows to make XHR request from a borwser.

On the other side, all requests that follows the pattern `http://clyde_server/B/*` are redirected to the *providerB*. This provider has configured an HTTP authentication prefilter, which means all requests must have authentication attached. The authentication filter is configured to work using basic authentication method and only one user is allowed to pass, the `userA`.

```json
{
	"loglevel" : "debug",
  "prefilters" : [
    {
      "id" : "logger",
      "path" : "clyde-simple-access-log",
      "config" : {
        "directory" : "./tmp/log",
        "file" : "access-%DATE%.log"
      }
    }
  ],

  "providers" : [
    {
      "id" : "providerA",
      "context" : "/A",
      "target" : "http://providerA:8080",
      "prefilters" : [
        {
          "id" : "cors",
          "path" : "clyde-cors"
        }
      ]
    },
    {
      "id" : "providerB",
      "context" : "/B",
      "target" : "http://providerB:8080",
      "prefilters" : [
				{
          "id": "http-auth",
          "path": "clyde-simple-http-auth",
          "config": {
            "realm": "providerB",
            "method": "basic",
            "consumers": {
              "userA": "passwordA"
            }
          }
        }
			]
    }
  ]
}
```
