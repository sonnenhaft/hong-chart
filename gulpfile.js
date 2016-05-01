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
        .pipe(concat('all.js'))
        .pipe(gulp.dest('.tmp'))
});

gulp.task('uglifyCSS', ['$stylus'], function () {
    return gulp.src('src/**/*.css')
        .pipe(require('gulp-minify-css')())
        .pipe(concat('all.css'))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('inlineSources', [ 'uglifyCSS', 'uglifyJS' ], function () {
    return gulp.src('./index.html')
        .pipe(require('gulp-processhtml')({
            commentMarker: 'process',
            process: true
        }))
        .pipe(require('gulp-inline-source')({ compress: false }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('copy-stubs', function () {
    return gulp.src([ 'stubs/*.csv', 'src/*.png' ]).pipe(require('gulp-copy')('.tmp'))
});

gulp.task('build', [ 'inlineSources' , 'copy-stubs'], function () {
    return gulp.src([ '.tmp/stubs/*', '.tmp/src/*.png', '.tmp/index.html' ], { base: '.tmp' })
        .pipe(require('gulp-zip')('hong-chart.zip'))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('$stylus', function () {
    return gulp.src('src/**/*.styl')
        .pipe(require('gulp-stylus')())
        .pipe(gulp.dest('./src/'));
});


gulp.task('$watch-styl',  function () {
    gulp.watch('src/**/*.styl', ['$stylus']);
});
