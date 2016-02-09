const join = require('path').join;
import {reverse, compose, curryN, prop, sortBy} from 'ramda';
import root from 'root-path';
import {l, e, onProp, addPropFn} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';
import frontmatter from 'front-matter';
import marked from './marker';
import string from 'string';
const mkdirp = Promise.promisify(require('mkdirp'));
const months = require('months');
const jade = require('jade');

//config
const outDir = root('out');
const tmplDir = root('templates');

function makeRenderer(tmplName){ return jade.compileFile( join(tmplDir, tmplName)); }
const renderPost = makeRenderer('post.jade');
const renderIndex = makeRenderer('index.jade');
const renderProjects = makeRenderer('projects.jade');

const makeTitleSlug = attrs => string(attrs.title).slugify().s;
const addSlug = addPropFn('slug')(makeTitleSlug);
const addTimestamp = addPropFn('timestamp')(p => (new Date(p.date)).getTime());

//takes dirname, makes it in "out" dir
const mkoutdir = compose(mkdirp, curryN(2, join)(outDir));

//creates an index.html file in dirname based on slug
const makeIndexHTMLOutPath = slug => join(outDir, slug, 'index.html');
const writeToOutDir = p => fs.writeFileAsync(makeIndexHTMLOutPath(p.slug), p.body);

function formatDate(d){
  d = new Date(d);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

Promise.all([
  getPosts()
    .tap(writeIndexPage)
    .then(writePosts),
  writeProjectsPage()
]).then(() => l('EVERYTHING done :)'));

////homepage
/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeIndexPage(posts){
  fs.readFileAsync(root('_content/index.md'), 'utf-8')
    .then(frontmatter) // => { body, attributes }
    //merge attributes to top level
    .then(p => { p.attributes.body = p.body; return p.attributes; })
    //add posts to template data
    .then(page => { page.posts = posts; return page; })
    .then(onProp('body')(marked)) //markdown
    .then(renderIndex) //template
    .then(rendered => fs.writeFile(join(outDir, 'index.html'), rendered));
}

/**
 * gets posts & adds metadata as needed
 * @return Promise<Array[post object]>
 */
function getPosts(){
  return getFiles(root('_content/posts'))
    .map(frontmatter) // => { body, attributes }
    //merge attributes to top level
    .map(p => { p.attributes.body = p.body; return p.attributes; })
    .map(addSlug)
    .each(post => mkoutdir(post.slug))
    //sort them
    .map(addTimestamp).then(sortBy(prop('timestamp'))).then(reverse)
    .map(onProp('date')(formatDate));
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writePosts(posts){
  return Promise.resolve(posts)
    .map(onProp('body')(marked)) //markdown
    .map(page => { page.body = renderPost(page); return page; } ) //template
    .each(post => l(`building... ${post.title}`))
    .each(writeToOutDir) //write
    .catch(err => { throw err; })
    .finally(() => l('all done!'));
}

function writeProjectsPage(){
  return Promise.resolve({
      slug : 'projects',
      body : renderProjects()
    })
    .tap(page => mkoutdir(page.slug))
    .then(writeToOutDir);
}
