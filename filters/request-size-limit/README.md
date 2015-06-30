# Request Size Limit

Blocks request depending on its body's length. It is based on the [raw-body](https://github.com/stream-utils/raw-body) module.

## Configuration

The filter inherits options from `raw-body` module:

- `limit` - The byte limit of the body. If the body ends up being larger than this limit, a `413` error code is returned. You can specify values in string format: `30kb`, `1mb`, ... (internally [bytes](https://github.com/visionmedia/bytes.js) module is used).
- `length` - The length of the stream. If the contents of the stream do not add up to this length, an `400` error code is returned.
- `encoding` - The requested encoding. By default, a `Buffer` instance will be returned. Default encoding is `utf8`. You can use any type of encoding supported by [iconv-lite](https://www.npmjs.org/package/iconv-lite#readme).

## Examples

### Block requests with body longer than 100 bytes:

```javascript
{
  "prefilters" : [
    {
      "id" : "request-size-limit",
      "path" : "./filters/request-size-limit",
      "config" : {
        "limit" : "100b"
      }
    }
    ...
  ]
}
```

### Blocks request with content length different than 1kb

```javascript
{
  "prefilters" : [
    {
      "id" : "request-size-limit",
      "path" : "./filters/request-size-limit",
      "config" : {
        "length" : 1024
      }
    }
    ...
  ]
}
```

## Notes:

* It must be configured as a global or provider's prefilter. It has no sense as a postfilter.
