'use strict';
const gulp = require('gulp');
const gulp_tslint = require('gulp-tslint');
const cp = require('child_process');
const server_dir = '../xml-languageserver';

gulp.task('tslint', () => {
    return gulp.src(['**/*.ts', '!**/*.d.ts', '!node_modules/**'])
      .pipe(gulp_tslint())
      .pipe(gulp_tslint.report());
});

gulp.task('build_server', ()=>
{
	cp.execSync("mvn clean verify", {cwd:server_dir, stdio:[0,1,2]} );
  gulp.src(server_dir +'/org.eclipse.lsp4xml/target/org.eclipse.lsp4xml-all.jar')
		.pipe(gulp.dest('./server'))
});


function isWin() {
	return /^win/.test(process.platform);
}

function isMac() {
	return /^darwin/.test(process.platform);
}

function isLinux() {
	return /^linux/.test(process.platform);
}

function gradlew() {
  // return server_dir +"/gradles";
	return isWin()? server_dir+"/gradlew.cmd": server_dir+"/gradlew";
}
