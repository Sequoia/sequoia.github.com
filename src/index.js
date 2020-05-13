const join = require('path').join;
const url = require('url');
const assert = require('assert');
const crypto = require('crypto');

import { reverse, compose, curryN, prop, has, sortBy, reject, isEmpty, not } from 'ramda';
import root from 'root-path';
import { l, e, onProp, addPropFn, addProp } from './util';
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

function formatDate(d) {
  d = new Date(d);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

Promise.all([
  getPosts('_content/posts')
    .tap(writeIndexPage)
    .tap(writeRssPage)
    .then(writePosts),
  getPosts('_content/shorts')
    .then(writeShortsPage),
  writeProjectsPage(),
  writeContactsPage(),
  writeThanksPage(),
  writeTalksPage()
]).then(() => l('EVERYTHING done :)'));

////homepage
/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeIndexPage(posts) {
  fs.readFileAsync(root('_content/index.md'), 'utf-8')
    .then(frontmatter) // => { body, attributes }
    //merge attributes to top level
    .then(p => { p.attributes.body = p.body; return p.attributes; })
    //add posts to template data
    .then(page => { page.posts = reject(has('hidden'))(posts); return page; })
    .then(onProp('body')(marked)) //markdown
    .then(tmpl.index) //template
    .then(rendered => fs.writeFileAsync(join(outDir, 'index.html'), rendered));
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeShortsPage(posts) {
  Promise.resolve(posts)
    .map(onProp('body')(marked)) //markdown each post
    .then(posts => tmpl.shorts({ shorts: posts }))
    .tap(() => mkdirp(join(outDir, 'shorts')))
    .then(rendered => fs.writeFileAsync(join(outDir, 'shorts', 'index.html'), rendered));
}

/**
 * gets posts & adds metadata as needed
 * @return Promise<Array[post object]>
 */
function getPosts(directory) {
  return getFiles(root(directory), { match: /.*\.md/ })
    .map(frontmatter) // => { body, attributes }
    //skip posts which yet have no frontmatter/metadata
    .filter(has('frontmatter'))
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
function writePosts(posts) {
  return Promise.resolve(posts)
    .map(onProp('body')(marked)) //markdown
    .map(page => { page.body = tmpl.post(page); return page; }) //template
    .each(post => l(`building... ${post.title}`))
    .each(writePage) //write
    .catch(err => { throw err; })
    .finally(() => l('all done!'));
}

function writeRssPage(posts) {
  // check the last publish hash to determine whether we should publish again (if anything changed)
  const hashPath = join(outDir, 'rss.hash.json')
  const newHash = crypto.createHash('md5').update(JSON.stringify(posts)).digest('hex');
  let oldHash
  try {
    oldHash = require(hashPath);
  } catch (e) {
    oldHash = "file doesn't exist yet 🤷‍";
  }
  if (newHash === oldHash) return Promise.resolve(null);
  console.log('updating RSS feed....');
  fs.writeFileSync(hashPath, JSON.stringify(newHash));
  // something changed
  const websiteBaseUrl = 'https://sequoia.makes.software/';
  const lastBuildDate = (new Date()).toUTCString();
  return Promise.resolve(posts)
    .filter(post => !post.hidden)
    .map(addPropFn('link')(post => url.resolve(websiteBaseUrl, post.slug)))
    .map(addPropFn('pubDate')(post => (new Date(post.timestamp)).toUTCString()))
    .then(posts => tmpl.rss({ posts, websiteBaseUrl, lastBuildDate }))
    .then(rendered => fs.writeFileAsync(join(outDir, 'rss.xml'), rendered));
}

function writeProjectsPage() {
  return createPage(
    { title: 'Projects', slug: 'projects' },
    tmpl.projects,
    [['projects', getProjectJson()]]
  );

  function getProjectJson() {
    let jsonRoute = root('_content/projects.json');
    return require(jsonRoute)
      .map(addPropFn('anchor')(project => string(project.name).slugify().s))
      // .map(addPropFn('anchor')(() => 'foo'))
      // .map(x => {console.log(x); return x;})
      .map(onProp('description')(marked)); //markdown
  }
}

function writeContactsPage() {
  return createPage(
    { title: 'Contact Me', slug: 'contact' },
    tmpl.contact
  );
}

//TODO: create a generic "page" function so index & work page fns can be merged
// merge it with existing createPage fn?
function writeTalksPage() {
  //params:
  // markdown (filename)
  // template fn
  // outfile name
  return fs.readFileAsync(root('_content/talks.md'), 'utf-8')
    .then(frontmatter) // => { body, attributes }
    //merge attributes to top level
    .then(p => { p.attributes.body = p.body; return p.attributes; })
    .then(onProp('body')(marked)) //markdown
    .then(page => { page.body = tmpl.page(page); return page; }) //template
    // .tap(console.log)
    .then(writePage);
  // .then(rendered => fs.writeFile(join(outDir, 'work', 'index.html'), rendered));
}

function writeThanksPage() {
  return createPage(
    { title: 'Thanks!', slug: 'thanks' },
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
function createPage(meta, renderer, extraData) {
  assert(meta.title, 'title required');
  assert(meta.slug, 'slug required');

  return Promise.resolve(meta)
    .then(function (page) {
      if (extraData) {
        extraData.forEach(function (prop) {
          addProp(prop[0])(prop[1])(page);
        });
      }
      return page;
    })
    .then(addPropFn('body')(renderer))
    .then(writePage);
}
