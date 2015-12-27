import {join, basename} from 'path';
import root from 'root-path';
import R from 'ramda';
import {l, e, justIndex} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';
import fm from 'front-matter';
import marked from './marker';
import string from 'string';

//utils for transforming a part of a [name, contents, {attributes}] array
const onFilename = justIndex(0);
const onContents = justIndex(1);

//get posts
const posts = getFiles(root('_content/posts'));

const addAttributesToArray = f => [f[0], f[1].body, f[1].attributes];
const addSlugifiedTitleToArray = f => f.concat(string(f[2].title).slugify().s);

////process posts
posts
  .map(onFilename(basename))
  .map(onContents(fm))
  .map(addAttributesToArray)
  .map(onContents(marked))
  .map(addSlugifiedTitleToArray)
  //.map(R.prop(3))
  .map(R.unary(l));
