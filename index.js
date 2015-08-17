/* jshint esnext: true */
var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var filesdebug = require('debug')('build:files');
var _          = require('highland');


Metalsmith(__dirname)
    .use(logFilenames)
    .use(markdown())
    .use(myLayouts())
    .destination('build')
    .build(handleError);

function myLayouts(){
  return layouts({
    'engine': 'handlebars',
    'default': 'default.hbs',
    'directory': 'templates',
    'partials': 'templates/partials'
  });
}

function logFilenames(files, met, next){
  _.keys(files)
    .each(filesdebug)
    .done(next);
}

function handleError(err){
  if(err){
    console.error('build failed :(');
    console.error(err);
  }
}
