'use strict';

var jade = require('jade');
var root = require('root-path');
var join = require('path').join;

//config
var tmplDir = root('templates');

function makeRenderer(tmplName) {
  return jade.compileFile(join(tmplDir, tmplName));
}

module.exports = {
  post: makeRenderer('post.jade'),
  index: makeRenderer('index.jade'),
  projects: makeRenderer('projects.jade'),
  contact: makeRenderer('contact.jade'),
  thanks: makeRenderer('thanks.jade')
};