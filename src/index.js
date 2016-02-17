const join = require('path').join;
const assert = require('assert');
import {reverse, compose, curryN, prop, sortBy} from 'ramda';
import root from 'root-path';
import {l, e, onProp, addPropFn, addProp} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';
import frontmatter from 'front-matter';
import marked from './marker';
import string from 'string';
const mkdirp = Promise.promisify(require('mkdirp'));
const months = require('months');
const tmpl = require('./renderers');

const outDir = root('out');

const makeTitleSlug = attrs => string(attrs.title).slugify().s;
const addSlug = addPropFn('slug')(makeTitleSlug);
const addTimestamp = addPropFn('timestamp')(p => (new Date(p.date)).getTime());

//creates an index.html file in dirname based on slug
const makeIndexHTMLOutPath = slug => join(outDir, slug, 'index.html');
const writeToOutDir = p => fs.writeFileAsync(makeIndexHTMLOutPath(p.slug), p.body);
//takes dirname, makes it in "out" dir
const mkoutdir = compose(mkdirp, curryN(2, join)(outDir));

const writePage = page => Promise.resolve(page)
                                 .tap(post => mkoutdir(page.slug))
                                 .then(writeToOutDir);

function formatDate(d){
  d = new Date(d);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

Promise.all([
  getPosts()
    .tap(writeIndexPage)
    .then(writePosts),
  writeProjectsPage(),
  writeContactsPage(),
  writeThanksPage()
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
    .then(tmpl.index) //template
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
    .map(page => { page.body = tmpl.post(page); return page; } ) //template
    .each(post => l(`building... ${post.title}`))
    .each(writePage) //write
    .catch(err => { throw err; })
    .finally(() => l('all done!'));
}

function writeProjectsPage(){
  return createPage(
    { title: 'Projects', slug : 'projects' },
    tmpl.projects,
    [ [ 'projects', getProjectJson() ] ]
  );

  function getProjectJson(){
    let jsonRoute = root('_content/projects.json');
    return require(jsonRoute)
      .map(onProp('description')(marked)); //markdown
  }
}

function writeContactsPage(){
  return createPage(
    { title: 'Contact Me', slug : 'contact' },
    tmpl.contact
  );
}

function writeThanksPage(){
  return createPage(
    { title: 'Thanks!', slug : 'thanks' },
    tmpl.thanks
  );
}

/**
 * @param {object}    meta
 * @param {string}    meta.title
 * @param {string}    meta.slug  Used to build output path
 * @param {function}  renderer   Jade compiled template
 * @param {array}     extraData  [ [ name, value ] ] tuples, tmpl data
 *                               name: string name of property
 *                               value: data
 * @return {Promise}
 */
function createPage(meta, renderer, extraData){
  assert(meta.title,  'title required');
  assert(meta.slug,   'slug required');

  return Promise.resolve(meta)
    .then(function(page){
      if(extraData){
        extraData.forEach(function(prop){
          addProp(prop[0])(prop[1])(page);
        });
      }
      return page;
    })
    .then(addPropFn('body')(renderer))
    .then(writePage);
}
