var gulp = require('gulp');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat');

gulp.task('uglifyJS', function () {
    return gulp.src('src/**/*.html')
        .pipe(require('gulp-angular-templatecache')({
            root: 'src',
            module: 'hong-layout'
        }))
        .pipe(addsrc.prepend('src/**/*.js'))
        .pipe(require('gulp-ng-annotate')())
        //.pipe(require('gulp-uglify')())
        .pipe(addsrc.prepend([
            'bower_components/angular/angular.min.js',
            'bower_components/d3/d3.min.js'
        ]))
        .pipe(concat('hong-chart.js'))
        .pipe(gulp.dest('build'))
});

gulp.task('uglifyCSS', ['$stylus'], function () {
    return gulp.src('src/**/*.css')
        .pipe(require('gulp-minify-css')())
        .pipe(concat('hong-chart.css'))
        .pipe(gulp.dest('build'));
});

gulp.task('inlineSources', ['uglifyCSS', 'uglifyJS'], function () {
    return gulp.src('./index.html')
        .pipe(require('gulp-processhtml')({
            commentMarker: 'process',
            process: true
        }))
        .pipe(require('gulp-inline-source')({compress: false}))
        .pipe(gulp.dest('build'));
});

gulp.task('copy-stubs', function () {
    return gulp.src(['stubs/*.csv', 'src/*.png']).pipe(require('gulp-copy')('build'))
});

gulp.task('build', ['inlineSources', 'copy-stubs'], function () {
    return gulp.src(['build/stubs/*', 'build/src/*.png', 'build/index.html'], {base: 'build'})
        .pipe(require('gulp-zip')('hong-chart.zip'))
        .pipe(gulp.dest('build'));
});

gulp.task('$stylus', function () {
    return gulp.src('src/**/*.styl')
        .pipe(require('gulp-stylus')())
        .pipe(gulp.dest('./src/'));
});

gulp.task('$watch-styl', function () {
    gulp.watch('src/**/*.styl', ['$stylus']);
});

gulp.task('jshint', function () {
    var jshint = require('gulp-jshint');
    return gulp.src('src/**/*.js')
        .pipe(jshint('./.jshintrc'))
        .pipe(jshint.reporter('default'))
});

