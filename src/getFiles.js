import Promise from 'bluebird';
import {readFiles} from 'node-dir';
import {basename} from 'path';
import {zip, unary} from 'ramda';
import {l} from './util';

/**
 * @param root path
 * @param options see: https://www.npmjs.com/package/node-dir
 * @return Promise : array of [filename, contents] tuples
 */
export default function getFiles(root, options){
  let contents = [];
  return new Promise((resolve, reject) => {
    readFiles(root, options,
      function(err, content, next) {
        if (err) throw err;
        contents.push(content);
        next();
      },
      function(err, files){
        if (err) return reject(err);
        console.log('finished reading files');
        resolve(zip(files.map(unary(basename)),contents));
      });
  });
}
