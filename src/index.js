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

//get posts
const posts = getFiles(root('_content/posts'));

const makeTitleSlug = attrs => string(attrs.title).slugify().s;
const addSlug = addPropFn('slug')(makeTitleSlug);

//takes dirname, makes it in "out" dir
const mkoutdir = compose(mkdirp, curryN(2, join)(root('out')));

//creates an index.html file in dirname based on slug
const makeIndexHTMLOutPath = slug => join(root('out'), slug, 'index.html');
const writeToOutDir = f => fs.writeFile(makeIndexHTMLOutPath(f.attributes.slug), f.body);

////process posts
posts
  .map(frontmatter) // => { body, attributes }
  .map(onProp('body')(marked))
  .map(onProp('attributes')(addSlug))
  .each(post => mkoutdir(post.attributes.slug))
  //.map(x => x.attributes)
  //.map(l)
  .each(writeToOutDir)
  .catch(err => { throw err; })
  .finally(() => l('all done!'));
