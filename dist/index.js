'use strict';

var _ramda = require('ramda');

var _rootPath = require('root-path');

var _rootPath2 = _interopRequireDefault(_rootPath);

var _util = require('./util');

var _getFiles = require('./getFiles');

var _getFiles2 = _interopRequireDefault(_getFiles);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _frontMatter = require('front-matter');

var _frontMatter2 = _interopRequireDefault(_frontMatter);

var _marker = require('./marker');

var _marker2 = _interopRequireDefault(_marker);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var join = require('path').join;

var fs = _bluebird2.default.promisifyAll(require('fs'));

var mkdirp = _bluebird2.default.promisify(require('mkdirp'));
var months = require('months');
var jade = require('jade');

//config
var outDir = (0, _rootPath2.default)('out');
var tmplDir = (0, _rootPath2.default)('templates');

function makeRenderer(tmplName) {
  return jade.compileFile(join(tmplDir, tmplName));
}
var renderPost = makeRenderer('post.jade');
var renderIndex = makeRenderer('index.jade');
var renderProjects = makeRenderer('projects.jade');
var renderContact = makeRenderer('contact.jade');

var makeTitleSlug = function makeTitleSlug(attrs) {
  return (0, _string2.default)(attrs.title).slugify().s;
};
var addSlug = (0, _util.addPropFn)('slug')(makeTitleSlug);
var addTimestamp = (0, _util.addPropFn)('timestamp')(function (p) {
  return new Date(p.date).getTime();
});

//takes dirname, makes it in "out" dir
var mkoutdir = (0, _ramda.compose)(mkdirp, (0, _ramda.curryN)(2, join)(outDir));

//creates an index.html file in dirname based on slug
var makeIndexHTMLOutPath = function makeIndexHTMLOutPath(slug) {
  return join(outDir, slug, 'index.html');
};
var writeToOutDir = function writeToOutDir(p) {
  return fs.writeFileAsync(makeIndexHTMLOutPath(p.slug), p.body);
};

//@TODO try this version
var writePage = function writePage(page) {
  return _bluebird2.default.resolve(page).tap(function (post) {
    return mkoutdir(p.slug);
  }).then(writeToOutDir);
};

function formatDate(d) {
  d = new Date(d);
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

_bluebird2.default.all([getPosts().tap(writeIndexPage).then(writePosts), writeProjectsPage(), writeContactsPage()]).then(function () {
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
    page.posts = posts;return page;
  }).then((0, _util.onProp)('body')(_marker2.default)) //markdown
  .then(renderIndex) //template
  .then(function (rendered) {
    return fs.writeFile(join(outDir, 'index.html'), rendered);
  });
}

/**
 * gets posts & adds metadata as needed
 * @return Promise<Array[post object]>
 */
function getPosts() {
  return (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts')).map(_frontMatter2.default) // => { body, attributes }
  //merge attributes to top level
  .map(function (p) {
    p.attributes.body = p.body;return p.attributes;
  }).map(addSlug).each(function (post) {
    return mkoutdir(post.slug);
  })
  //sort them
  .map(addTimestamp).then((0, _ramda.sortBy)((0, _ramda.prop)('timestamp'))).then(_ramda.reverse).map((0, _util.onProp)('date')(formatDate));
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writePosts(posts) {
  return _bluebird2.default.resolve(posts).map((0, _util.onProp)('body')(_marker2.default)) //markdown
  .map(function (page) {
    page.body = renderPost(page);return page;
  }) //template
  .each(function (post) {
    return (0, _util.l)('building... ' + post.title);
  }).each(writeToOutDir) //write
  .catch(function (err) {
    throw err;
  }).finally(function () {
    return (0, _util.l)('all done!');
  });
}

function writeProjectsPage() {
  //no md page for this just putting the values here
  var page = {
    title: 'Projects',
    slug: 'projects'
  };

  function getProjectJson() {
    var jsonRoute = (0, _rootPath2.default)('_content/projects.json');
    return require(jsonRoute).map((0, _util.onProp)('description')(_marker2.default)); //markdown
  }

  //@TODO lol w/e
  return _bluebird2.default.resolve(page).then((0, _util.addPropFn)('projects')(getProjectJson)).then((0, _util.addPropFn)('body')(renderProjects)).tap(function (page) {
    return mkoutdir(page.slug);
  }).then(writeToOutDir);
}

//@TODO merge this with writeProjectPage
function writeContactsPage() {
  //no md page for this just putting the values here
  var page = {
    title: 'Contact Me',
    slug: 'contact'
  };

  return _bluebird2.default.resolve(page).then((0, _util.addPropFn)('body')(renderContact)).tap(function (page) {
    return mkoutdir(page.slug);
  }).then(writeToOutDir);
}