import join from 'path';
import root from 'root-path';
import {l, e, onProp, addPropFn} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';
import frontmatter from 'front-matter';
import marked from './marker';
import string from 'string';

//get posts
const posts = getFiles(root('_content/posts'));

const makeTitleSlug = attrs => string(attrs.title).slugify().s;
const addSlug = addPropFn('slug')(makeTitleSlug);
//creates an index.html file in dirname based on slug
//TODO: need to create out dirs to use this
const makeIndexHTMLOutPath = slug => join(root('out'), slug, 'index.html');
const writeToOutDir = f => fs.writeFile(makeIndexHTMLOutPath(f.attributes.slug), f.body);

////process posts
posts
  .map(frontmatter) // => { body, attributes }
  .map(onProp('body')(marked))
  .map(onProp('attributes')(addSlug))
  .map(x => x.attributes)
  .map(l)
  //.map(writeToOutDir)
  .catch(e)
  .finally((res) => l('all done!', res));
