var fs = require("fs");
var path = require("path");
var module_holder = {};


function Loader(middlewaresPath) {
  fs.lstat(middlewaresPath, function(err, stat) {
    if (stat.isDirectory()) {
      // we have a directory: do a tree walk
      fs.readdir(middlewaresPath, function(err, files) {
        var f, l = files.length;
        for (var i = 0; i < l; i++) {
          f = path.join(middlewaresPath, files[i]);
          Loader(f);
        }
      });
    } else {
      // we have a file: load it
      if(path.basename(middlewaresPath) === 'index.js') {
        module_holder[middlewaresPath] = require(middlewaresPath);
        console.log("loaded mod ", middlewaresPath);
      }
    }
  });

  return module_holder;
}

module.exports = Loader;
