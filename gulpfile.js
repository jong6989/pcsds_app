const { src, dest } = require('gulp');
var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');

exports.default = function() {
  return src('app/**/*.js')
    .pipe(concat('app.js'))
    .pipe(dest('js'));
}