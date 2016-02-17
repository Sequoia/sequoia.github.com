const jade = require('jade');
const root = require('root-path');
const join = require('path').join;

//config
const tmplDir = root('templates');

function makeRenderer(tmplName){ return jade.compileFile( join(tmplDir, tmplName)); }

module.exports = {
  post : makeRenderer('post.jade'),
  index : makeRenderer('index.jade'),
  projects : makeRenderer('projects.jade'),
  contact : makeRenderer('contact.jade'),
  thanks : makeRenderer('thanks.jade')
};
