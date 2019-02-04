'use strict';


// ---
// Setup: load plugins and define config variables
// ---


// Plugins
const gulp = require("gulp");
const cp = require("child_process");
const shell = require('gulp-shell')
const gnf = require("gulp-npm-files");
const browsersync = require("browser-sync").create();
const del = require("del");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const cheerio = require("gulp-cheerio");
const svgSymbols = require("gulp-svg-symbols");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");

// Config
const config = {
  browsersync: {
    server: {
      baseDir: '_site',
      reloadDelay: 2000,
      debounce: 200,
      notify: true,
      ghostMode: {
        clicks: true,
        location: true,
        forms: true,
        scroll: false
      }
    }
  },
  icons: {
    title: '%f icon',
    svgAttrs: {
      class: 'c-icon-set',
    },
    templates: ['default-svg']
  },
  cheerio: {
    run: function ($) {
      $('[fill]').removeAttr('fill');
    },
    parserOptions: { xmlMode: true }
  },
  autoprefixer: {
    browsers: [
      'last 2 version',
      '> 2%',
      'ie >= 9',
      'ios >= 8',
      'android >= 4'
    ]
  },
  jsConcat: 'scripts.js'
};

// Paths
const paths = {
  vendor: './_vendor/',
  scssSrc: './assets/_scss/**/*.scss',
  cssSrc: './assets/css/',
  cssDist: './_site/assets/css/',
  jsSrc: [
    './_vendor/jquery/dist/jquery.slim.js',
    './_vendor/svgxuse/svgxuse.js',
    './assets/js/_scripts/*.js'
  ],
  jsDist: './assets/js/',
  jsJekyllDist: './_site/assets/js/',
  iconsSrc: './_artwork/icons/*.svg',
  iconsDist: './assets/img/svg/',
  cssWatch: './assets/_scss/**/*.scss',
  jsWatch: './assets/js/_scripts/**/*.js',
  iconsWatch: './_artwork/icons/*.svg',
  imageWatch: './assets/img/**/*',
  siteWatch: [
    './assets/img/**/*.png',
    './assets/img/**/*.jpg',
    './assets/img/**/*.svg',
    './**/*.html',
    './_pages/**/*.markdown',
    './_posts/**/*.markdown',
    './_data/**/*.yml',
    './_config.yml',
    '!_site/**/*.*'
  ]
}

// Install
// ---
// Copy dependencies from `node_modules` to $paths.vendor
function copyNpmDependencies() {
  return gulp.src(gnf(), {base:'./'})
    .pipe(gulp.dest(paths.vendor));
}

// Move `$paths.vendor/node_modules/**/*` to `$paths.vendor/**/*`
function copyVendorDependencies() {
  return gulp.src(paths.vendor + 'node_modules/**/*')
    .pipe(gulp.dest(paths.vendor));
}

// Delete `$paths.vendor/node_modules`
function dependencies() {
  return del([paths.vendor + 'node_modules/']);
}

// BrowserSync
// ---
function browserSync(done) {
  browsersync.init(config.browsersync);
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Jekyll
// ---
// Incremental build
function jekyll() {
  return cp.spawn("bundle", ["exec", "jekyll", "build", "--incremental"], { stdio: "inherit" });
}

// Production build
function jekyllBuild() {
  return cp.spawn("bundle", ["exec", "jekyll", "build"], { stdio: "inherit" });
}


// Clean
// ---
// Clean site folder
function clean() {
  return del(["./_site/"]);
}

// Icons
// ---
// Convert multiple svg's to one symbol file
// https://css-tricks.com/svg-symbol-good-choice-icons/
function icons() {
  return gulp.src(paths.iconsSrc)
    .pipe(cheerio(config.cheerio))
    .pipe(svgSymbols(config.icons))
    .pipe(gulp.dest(paths.iconsDist))
    .pipe(browsersync.stream());
}

// CSS
// ---
function css() {
  return gulp
    .src(paths.scssSrc)
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(postcss([autoprefixer(config.autoprefixer)]))
    .pipe(gulp.dest(paths.cssSrc))
    .pipe(gulp.dest(paths.cssDist))
    .pipe(browsersync.stream());
}

function cssProduction() {
  return gulp
    .src(paths.scssSrc)
    .pipe(sass())
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(config.autoprefixer), cssnano()]))
    .pipe(gulp.dest(paths.cssSrc))
    .pipe(gulp.dest(paths.cssDist));
}

// JS
// ---
// Transpile, concatenate and minify scripts
function scripts() {
  return gulp
    .src(paths.jsSrc)
    .pipe(concat(config.jsConcat))
    .pipe(gulp.dest(paths.jsDist))
    .pipe(gulp.dest(paths.jsJekyllDist))
    .pipe(browsersync.stream())
}

function scriptsProduction() {
  return gulp
    .src(paths.jsSrc)
    .pipe(concat(config.jsConcat))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.jsDist))
    .pipe(gulp.dest(paths.jsJekyllDist));
}

// Watch files
// ---
function watchFiles() {
  gulp.watch(paths.cssWatch, css);
  gulp.watch(paths.jsWatch, scripts);
  gulp.watch(paths.jsWatch, scripts);
  gulp.watch(paths.iconsWatch, icons);
  gulp.watch(
    paths.siteWatch,
    gulp.series(jekyll, browserSyncReload)
  );
}

// Tasks
// ---
gulp.task("install", gulp.series(copyNpmDependencies, copyVendorDependencies, dependencies));
gulp.task("jekyll", jekyll);
gulp.task("jekyllBuild", jekyllBuild);
gulp.task("icons", icons);
gulp.task("css", css);
gulp.task("cssProduction", cssProduction);
gulp.task("scripts", scripts);
gulp.task("scriptsProduction", scriptsProduction);
gulp.task("clean", clean);

// Default
gulp.task(
  "default",
  gulp.series(
    "install",
    clean,
    gulp.parallel(css, scripts,icons),
    jekyll
  )
);

// Build
gulp.task(
  "build",
  gulp.series(
    "install",
    clean,
    gulp.parallel(cssProduction, scriptsProduction,icons),
    jekyllBuild
  )
);

// Watch
gulp.task(
  "watch",
  gulp.series(
    "default",
    gulp.parallel(watchFiles, browserSync)
  )
);
