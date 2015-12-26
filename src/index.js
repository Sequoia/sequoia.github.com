import {join, basename} from 'path';
import root from 'root-path';
import R from 'ramda';
import {l, e} from './util';
import './getFiles';
import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));
import getFiles from './getFiles';

//get posts
const posts = getFiles(root('_content/posts'));
//process posts
posts
  .then(l);
