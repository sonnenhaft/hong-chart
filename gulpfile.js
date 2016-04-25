var gulp = require('gulp');

gulp.task('uglifyTemplates', function () {
    return gulp.src('src/**/*.html').pipe(require('gulp-angular-templatecache')({
        root: 'src',
        module: 'hong-layout'
    })).pipe(gulp.dest('.tmp'));
});

var concat = require('gulp-concat');
gulp.task('uglifyCSS', function () {
    return gulp.src([
            'src/**/*.css'
        ])
        .pipe(require('gulp-minify-css')())
        .pipe(concat('all.css'))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('uglifyJS', function () {
    return gulp.src([
            'src/vendor/angular-v1.5.5.js',
            'src/hong-layout/hong-layout.js',
            'src/vendor/d3-v3.5.16.js',
            'src/**/*.js'
        ])
        .pipe(require('gulp-ng-annotate')())
        .pipe(require('gulp-uglify')())
        .pipe(concat('all.js'))
        .pipe(gulp.dest('.tmp'))
});

gulp.task('inlineSources', [ 'uglifyCSS', 'uglifyJS', 'uglifyTemplates' ], function () {
    return gulp.src('./index.html')
        .pipe(require('gulp-processhtml')({
            commentMarker: 'process',
            process: true
        }))
        .pipe(require('gulp-inline-source')({
            compress: false
        }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('copy-stubs', function () {
    return gulp.src('stubs/*').pipe(require('gulp-copy')('.tmp'))
});

gulp.task('build', [ 'copy-stubs', 'inlineSources' ], function () {
    return gulp.src([ '.tmp/stubs/*', '.tmp/index.html' ], { base: '.tmp' })
        .pipe(require('gulp-zip')('hong-chart.zip'))
        .pipe(gulp.dest('.tmp'));
});
