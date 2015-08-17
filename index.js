/* jshint esnext: true */
var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var ignore     = require('metalsmith-ignore');
var less       = require('metalsmith-less');
var layouts    = require('metalsmith-layouts');
var filesdebug = require('debug')('build:files');
var _          = require('highland');
var path       = require('path');


Metalsmith(__dirname)
  //CONTENTS & LAYOUT
    .use(markdown())
    .use(myLayouts())

  //LESS/CSS
    .use(less({
      render: {
        pattern: 'less/clean-blog.less',
        paths: [
            path.join('src/less')
        ]
      }
    }))
    .use(ignore(['less/**', 'css/includes/*']))

  //END
    .destination('site')
    .build(handleError);

function myLayouts(){
  return layouts({
    'engine': 'handlebars',
    'default': 'post.hbs',
    'directory': 'templates',
    'partials': 'templates/partials',
    'pattern': '*.html'
  });
}

function logFilenames(files, met, next){
  filesdebug('=============');
  _.keys(files)
    //.each(console.log.bind(console))
    //.filter(file => /\.html$/.test(file))
    .each(file => {
      //filesdebug(file, files[file].contents.toString('utf8'));
      filesdebug(file);
    })
    .done(next);
}

function handleError(err){
  if(err){
    console.error('build failed :(');
    throw err;
  }else{
    console.log('build success');
  }
}
