const jade = require('jade');
const root = require('root-path');
const path = require('path');

//config
const tmplDir = root('templates');

const getTmplPath = path.join.bind(path, tmplDir);
function makeRenderer(tmplName){ return jade.compileFile( getTmplPath(tmplName)); }

module.exports = {
  post : makeRenderer('post.jade'),
  page : makeRenderer('page.jade'),
  index : makeRenderer('index.jade'),
  shorts : makeRenderer('shorts.jade'),
  projects : makeRenderer('projects.jade'),
  contact : makeRenderer('contact.jade'),
  thanks : makeRenderer('thanks.jade')
};
