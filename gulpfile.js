"use strict";

var gulp = require("gulp"),
  nodemon = require("gulp-nodemon"),
  eslint = require("gulp-eslint");


gulp.task("lint", function () {
  return gulp.src(["!./node-modules", "**/*.js"])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task("develop", function () {
  nodemon({
    script: "bin/www",
    ext: "js"
  });
});


gulp.task("default", [
  "develop"
]);
