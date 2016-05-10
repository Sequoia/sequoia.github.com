'use strict';

var jade = require('jade');
var root = require('root-path');
var path = require('path');

//config
var tmplDir = root('templates');

var getTmplPath = path.join.bind(path, tmplDir);
function makeRenderer(tmplName) {
  return jade.compileFile(getTmplPath(tmplName));
}

module.exports = {
  post: makeRenderer('post.jade'),
  index: makeRenderer('index.jade'),
  projects: makeRenderer('projects.jade'),
  contact: makeRenderer('contact.jade'),
  thanks: makeRenderer('thanks.jade')
};