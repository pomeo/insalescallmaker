var gulp = require('gulp'),
    imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    prefix = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    grep = require('gulp-grep-stream'),
    mocha = require('gulp-mocha'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    nib = require('nib'),
    karma = require('karma').server,
    watch = require('gulp-watch'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

gulp.task('images', function () {
  watch({glob: 'src/img/**/*'},
        function(files) {
          files
          .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
          .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngcrush()]
          }))
          .pipe(gulp.dest('public/img'))
          .pipe(reload({stream:true}))
          .pipe(notify('Update images <%= file.relative %>'));
        });
});

gulp.task('libs', function() {
  return gulp.src(['bower_components/jquery/dist/jquery.js',
                   'bower_components/jquery-validation/dist/jquery.validate.js',
                   'bower_components/jquery-form/jquery.form.js',
                   'bower_components/lodash/lodash.js',
                   'bower_components/uikit/js/uikit.js',
                   'bower_components/uikit/js/components/notify.js'])
          .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
          .pipe(sourcemaps.init())
          .pipe(uglify())
          .pipe(concat('libs.js'))
          .pipe(sourcemaps.write('maps', {
            sourceMappingURLPrefix: '/js/'
          }))
          .pipe(gulp.dest('public/js'))
          .pipe(reload({stream:true}))
          .pipe(notify({
              onLast: true,
              message: 'Update libs.js'
          }));
});

gulp.task('compress', function() {
    return gulp.src(['src/js/ui.js'])
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write('maps', {
            sourceMappingURLPrefix: '/js/'
        }))
        .pipe(gulp.dest('public/js'))
        .pipe(reload({stream:true}))
        .pipe(notify({
            onLast: true,
            message: 'Update app.js'
        }));
});

gulp.task('stylus', function () {
    return gulp.src(['bower_components/uikit/css/uikit.css',
                     'bower_components/uikit/css/uikit.almost-flat.css',
                     'bower_components/uikit/css/components/notify.almost-flat.css',
                     'bower_components/uikit/css/components/notify.css',
                     'src/css/styles.styl'])
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sourcemaps.init())
        .pipe(stylus({compress: false, use: nib()}))
        .pipe(prefix())
        .pipe(minifyCSS())
        .pipe(concat('styles.css'))
        .pipe(sourcemaps.write('maps'), {
            sourceMappingURLPrefix: '/css/'
        })
        .pipe(gulp.dest('public/css'))
        .pipe(reload({stream:true}))
        .pipe(notify({
            onLast: true,
            message: 'Update stylus'
        }));
});

gulp.task('build', ['libs', 'compress', 'stylus']);

gulp.task('mocha', function() {
  gulp.src(['test/*.js'], {read: false})
  .pipe(watch({ emit: 'all' }, function(files) {
          files
          .pipe(mocha({ reporter: 'spec' }))
          .on('error', function() {
            if (!/tests? failed/.test(err.stack)) {
              console.log(err.stack);
            }
          });
        }));
});

gulp.task('karma', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma/karma.conf.js',
    singleRun: false
  }, done);
});

gulp.task('browser-sync', function() {
  browserSync.init(null, {
    proxy: 'localhost:3000',
    open: false,
    port: 8080,
    notify: false
  });
});

gulp.task('default', ['build', 'images', 'browser-sync'], function () {
  gulp.watch(['views/**/*.jade'], reload);
  gulp.watch(['src/**/*.styl'], ['build']);
  gulp.watch(['src/**/*.js'], ['build']);
});
