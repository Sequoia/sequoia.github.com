'use strict';

var _ramda = require('ramda');

var _rootPath = require('root-path');

var _rootPath2 = _interopRequireDefault(_rootPath);

var _util = require('./util');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _getFiles = require('./getFiles');

var _getFiles2 = _interopRequireDefault(_getFiles);

var _frontMatter = require('front-matter');

var _frontMatter2 = _interopRequireDefault(_frontMatter);

var _marker = require('./marker');

var _marker2 = _interopRequireDefault(_marker);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var join = require('path').join;
var url = require('url');
var assert = require('assert');
var crypto = require('crypto');

var fs = _bluebird2.default.promisifyAll(require('fs'));

var mkdirp = _bluebird2.default.promisify(require('mkdirp'));
var months = require('months');
var tmpl = require('./renderers');
var websiteBaseUrl = 'https://sequoia.makes.software/';

var outDir = (0, _rootPath2.default)('out');

var makeTitleSlug = function makeTitleSlug(attrs) {
  return (0, _string2.default)(attrs.title).slugify().s;
};
var addSlug = (0, _util.addPropFn)('slug')(makeTitleSlug);
var addCanonicalUrl = (0, _util.addPropFn)('canonicalUrl')(function (post) {
  return url.resolve(websiteBaseUrl, post.slug) + '/';
});
var addTimestamp = (0, _util.addPropFn)('timestamp')(function (p) {
  return new Date(p.date).getTime();
});

//creates an index.html file in dirname based on slug
var makeIndexHTMLOutPath = function makeIndexHTMLOutPath(slug) {
  return join(outDir, slug, 'index.html');
};
var writeToOutDir = function writeToOutDir(p) {
  return fs.writeFileAsync(makeIndexHTMLOutPath(p.slug), p.body);
};
//takes dirname, makes it in "out" dir
var mkoutdir = (0, _ramda.compose)(mkdirp, (0, _ramda.curryN)(2, join)(outDir));

var writePage = function writePage(page) {
  return _bluebird2.default.resolve(page).tap(function (post) {
    return mkoutdir(page.slug);
  }).then(writeToOutDir);
};

function formatDate(d) {
  d = new Date(d);
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

_bluebird2.default.all([getPosts('_content/posts').tap(writeIndexPage).map((0, _util.onProp)('body')(_marker2.default)) //markdown
.map(addCanonicalUrl).tap(writeRssPage).then(writePosts), getPosts('_content/shorts').then(writeShortsPage), writeProjectsPage(), writeContactsPage(), writeThanksPage(), writeTalksPage()]).then(function () {
  return (0, _util.l)('EVERYTHING done :)');
});

////homepage
/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeIndexPage(posts) {
  fs.readFileAsync((0, _rootPath2.default)('_content/index.md'), 'utf-8').then(_frontMatter2.default) // => { body, attributes }
  //merge attributes to top level
  .then(function (p) {
    p.attributes.body = p.body;return p.attributes;
  })
  //add posts to template data
  .then(function (page) {
    page.posts = (0, _ramda.reject)((0, _ramda.has)('hidden'))(posts);return page;
  }).then((0, _util.onProp)('body')(_marker2.default)) //markdown
  .then(tmpl.index) //template
  .then(function (rendered) {
    return fs.writeFileAsync(join(outDir, 'index.html'), rendered);
  });
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeShortsPage(posts) {
  _bluebird2.default.resolve(posts).filter(function (post) {
    return !post.hidden;
  }).map((0, _util.onProp)('body')(_marker2.default)) //markdown each post
  .then(function (posts) {
    return tmpl.shorts({ shorts: posts });
  }).tap(function () {
    return mkdirp(join(outDir, 'shorts'));
  }).then(function (rendered) {
    return fs.writeFileAsync(join(outDir, 'shorts', 'index.html'), rendered);
  });
}

/**
 * gets posts & adds metadata as needed
 * @return Promise<Array[post object]>
 */
function getPosts(directory) {
  return (0, _getFiles2.default)((0, _rootPath2.default)(directory), { match: /.*\.md/ }).map(_frontMatter2.default) // => { body, attributes }
  //skip posts which yet have no frontmatter/metadata
  .filter((0, _ramda.has)('frontmatter'))
  //merge attributes to top level
  .map(function (p) {
    p.attributes.body = p.body;return p.attributes;
  }).map(addSlug)
  //sort them
  .map(addTimestamp).then((0, _ramda.sortBy)((0, _ramda.prop)('timestamp'))).then(_ramda.reverse).map((0, _util.onProp)('date')(formatDate));
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writePosts(posts) {
  return _bluebird2.default.resolve(posts).map(function (page) {
    page.body = tmpl.post(page);return page;
  }) //template
  .each(function (post) {
    return (0, _util.l)('building... ' + post.title);
  }).each(writePage) //write
  .catch(function (err) {
    throw err;
  }).finally(function () {
    return (0, _util.l)('all done!');
  });
}

function writeRssPage(posts) {
  // check the last publish hash to determine whether we should publish again (if anything changed)
  var hashPath = join(outDir, 'rss.hash.json');
  var newHash = crypto.createHash('md5').update(JSON.stringify(posts)).digest('hex');
  var oldHash = void 0;
  try {
    oldHash = require(hashPath);
  } catch (e) {
    oldHash = "file doesn't exist yet 🤷‍";
  }
  if (newHash === oldHash) return _bluebird2.default.resolve(null);
  console.log('updating RSS feed....');
  fs.writeFileSync(hashPath, JSON.stringify(newHash));
  // something changed
  var lastBuildDate = new Date().toUTCString();
  return _bluebird2.default.resolve(posts).filter(function (post) {
    return !post.hidden;
  }).map((0, _util.addPropFn)('pubDate')(function (post) {
    return new Date(post.timestamp).toUTCString();
  })).then(function (posts) {
    return tmpl.rss({ posts: posts, websiteBaseUrl: websiteBaseUrl, lastBuildDate: lastBuildDate });
  }).then(function (rendered) {
    return fs.writeFileAsync(join(outDir, 'rss.xml'), rendered);
  });
}

function writeProjectsPage() {
  return createPage({ title: 'Projects', slug: 'projects' }, tmpl.projects, [['projects', getProjectJson()]]);

  function getProjectJson() {
    var jsonRoute = (0, _rootPath2.default)('_content/projects.json');
    return require(jsonRoute).map((0, _util.addPropFn)('anchor')(function (project) {
      return (0, _string2.default)(project.name).slugify().s;
    }))
    // .map(addPropFn('anchor')(() => 'foo'))
    // .map(x => {console.log(x); return x;})
    .map((0, _util.onProp)('description')(_marker2.default)); //markdown
  }
}

function writeContactsPage() {
  return createPage({ title: 'Contact Me', slug: 'contact' }, tmpl.contact);
}

//TODO: create a generic "page" function so index & work page fns can be merged
// merge it with existing createPage fn?
function writeTalksPage() {
  //params:
  // markdown (filename)
  // template fn
  // outfile name
  return fs.readFileAsync((0, _rootPath2.default)('_content/talks.md'), 'utf-8').then(_frontMatter2.default) // => { body, attributes }
  //merge attributes to top level
  .then(function (p) {
    p.attributes.body = p.body;return p.attributes;
  }).then((0, _util.onProp)('body')(_marker2.default)) //markdown
  .then(function (page) {
    page.body = tmpl.page(page);return page;
  }) //template
  // .tap(console.log)
  .then(writePage);
  // .then(rendered => fs.writeFile(join(outDir, 'work', 'index.html'), rendered));
}

function writeThanksPage() {
  return createPage({ title: 'Thanks!', slug: 'thanks' }, tmpl.thanks);
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

  return _bluebird2.default.resolve(meta).then(function (page) {
    if (extraData) {
      extraData.forEach(function (prop) {
        (0, _util.addProp)(prop[0])(prop[1])(page);
      });
    }
    return page;
  }).then((0, _util.addPropFn)('body')(renderer)).then(writePage);
}