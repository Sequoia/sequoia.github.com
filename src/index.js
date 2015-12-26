import {join, basename} from 'path';
import root from 'root-path';
import R from 'ramda';
import {l, e, justIndex} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';
import fm from 'front-matter';

//utils for transforming a part of a [name, contents, {attributes}] array
const onFilename = justIndex(0);
const onContents = justIndex(1);

//get posts
const posts = getFiles(root('_content/posts'));
////process posts
posts
  .map(onFilename(basename))
  .map(onContents(fm))
  .map(f => [f[0], f[1].body, f[1].attributes]) //move attribs into array
  .then(l);
