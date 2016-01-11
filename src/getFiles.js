import Promise from 'bluebird';
import {readFiles} from 'node-dir';
import {l} from './util';

/**
 * @param root path
 * @param options see: https://www.npmjs.com/package/node-dir
 * @return Promise : array [contents]
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
      function(err, filenames){
        if (err) return reject(err);
        l('finished reading files');
        resolve(contents);
      });
  });
}
