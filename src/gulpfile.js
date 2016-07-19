var gulp = require('gulp');
var resolveDependencies = require('gulp-resolve-dependencies');
var concat = require('gulp-concat');
var watch = require('gulp-watch');

gulp.task('watch', function() {
	watch('js/*.js')
		.src([ 'js/*.js', 'js/external/*.js' ])
		.pipe(resolveDependencies())
		.pipe(concat('js/all.js'))
		.pipe(gulp.dest('./'))
});

gulp.task('default', function() {
	gulp.src([ 'js/*.js', 'js/external/*.js' ])
		.pipe(resolveDependencies())
		.pipe(concat('js/all.js'))
		.pipe(gulp.dest('./'))
});