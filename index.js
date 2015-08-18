/* jshint esnext: true */
var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var collections= require('metalsmith-collections');
var ignore     = require('metalsmith-ignore');
var less       = require('metalsmith-less');
var layouts    = require('metalsmith-layouts');
var filesdebug = require('debug')('build:files');
var _          = require('highland');
var path       = require('path');


Metalsmith(__dirname)
  //CONTENTS & LAYOUT
    .use(collections())
    .use((files, meta, next) => {
      _.pairs(files)
        .find(f => f[1].layout === 'home.hbs')
        .each(f => files[f[0]].posts = meta._metadata.posts)
        .done(next);
    })
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
    .use(logFilenames)
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
  _.pairs(met)
    .each(filesdebug);
      //filesdebug(met);
  _.keys(files)
    //.each(console.log.bind(console))
    .filter(file => /index\.html$/.test(file))
    .each(file => {
      filesdebug(file, files[file]);
      //filesdebug(file);
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
