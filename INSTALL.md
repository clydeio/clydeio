# Installing Clyde

## Requirements

Clyde is a NodeJS based application so you need to have Node installed on your system in addition to the npm tool.

## Installation

To work with Clyde as a standalone application you need to:

* Download Clyde, no matter if cloning source code repository or downloading a ZIP file with a release.
* Go into the Clyde folder.
* Install all Clyde dependencies running: `npm install`.
* Install any filter you want to use with Clyde with `npm install filter_package`.
* Create a `config.json` file that contains the desired configuration for Clyde.

## Run Clyde

Within the Clyde directory execute the next command and see the message:

```
> ./bin/index.js config.json
Clyde is listening on port 8000
```
