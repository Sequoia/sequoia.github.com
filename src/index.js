const join = require('path').join;
import {compose, curryN} from 'ramda';
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

//config
const outDir = root('out');

//get posts
const posts = getFiles(root('_content/posts'));

const makeTitleSlug = attrs => string(attrs.title).slugify().s;
const addSlug = addPropFn('slug')(makeTitleSlug);

//takes dirname, makes it in "out" dir
const mkoutdir = compose(mkdirp, curryN(2, join)(outDir));

//creates an index.html file in dirname based on slug
const makeIndexHTMLOutPath = slug => join(outDir, slug, 'index.html');
const writeToOutDir = p => fs.writeFile(makeIndexHTMLOutPath(p.slug), p.body);

function formatDate(d){
  d = new Date(d);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

////process posts
posts
  .map(frontmatter) // => { body, attributes }
  //merge attributes to top level
  .map(p => { p.attributes.body = p.body; return p.attributes; })
  .map(onProp('body')(marked))
  .map(addSlug)
  .each(post => mkoutdir(post.slug))
  .map(onProp('date')(formatDate))
  .tap(l)
  //.each(writeToOutDir)
  .catch(err => { throw err; })
  .finally(() => l('all done!'));
