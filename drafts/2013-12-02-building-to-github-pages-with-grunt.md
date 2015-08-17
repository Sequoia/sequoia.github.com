---
layout: post
title: "Building to Github Pages with Grunt"
description: ""
category:
tags: [grunt, github, javascript]
---
{% include JB/setup %}
A while ago I created a [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) to anonymize Facebook for screenshots, [the Afonigizer](http://sequoia.github.io/afonigizer/). To distribute it, I chose to use [Github Pages](http://pages.github.com/), Github's free hosting service.  To automate the process of getting updates to my bookmarklet from a javascipt file in my repository to a page on `github.io`, I used [Grunt](http://gruntjs.com/).  Besides building and distributing distributing bookmarklets, I am sure there are other reasons to build to github pages (or another branch on your repo), so I'm sharing my workflow here.

The following example assumes you are familiar with [bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet), [Github Pages](http://pages.github.com/), and that you've used [Grunt](http://gruntjs.com/).  We'll use a modified version of my bookmarklet build as an example.

So, we have our bookmarklet written, linted, minified, and committed to the `master` branch, and we're ready to publish it to the web.  From a high level, this means **checking out** the `gh-pages` branch, **rebasing** onto master to get the latest javascript, **interpolating** the javascript file into the template, **committing** the new `index.html` file, and **checking out** `master` again to wrap up.  Switching branches and rebasing are peculiar tasks for a build, but it can be done (even if it shouldn't be) and the following Gruntfile snippet explains how.

## Prerequisites and setup
We need a minified javascript file:

```javascript
(function(){var a="@",b="_",c="sequoia";alert(a+b+c);})();
```

And a template file to serve the bookmarklet:

```html
<!-- filename: index.html.tpl -->
<html><body> 
	<a href='javascript:void(<%= marklet %>);'>Bookmarklet!</a>
</body></html>
```

## The Gruntfile
*abridged; see full version [here](https://github.com/Sequoia/afonigizer/blob/master/Gruntfile.js)*

```javascript
//we'll need `fs` to read the bookmarklet file
fs = require('fs');
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

/* ... */

    gitcheckout: {
      //note that (non-"string") object keys cannot contain hyphens in javascript
      ghPages : { options : { branch : 'gh-pages' } },
      master : { options : { branch : 'master' } }
    },
    gitcommit: {
      bookmarkletUpdate : {
        //add <config:pkg.version> or something else here
        //for a more meaningful commit message
        options : { message : 'updating marklet' },
        files :  { src: ['index.html'] }
      }
    },
    gitrebase: {
      master : { options : { branch : 'master' } }
    },
    template : {
      'bookmarkletPage' : {
        options : {
          data : function(){
            return {
              //the only "data" are the contents of the javascript file
              marklet : fs.readFileSync('dist/afonigizer.min.js','ascii').trim()
            };
          }
        },
        files : {
          'index.html' : ['index.html.tpl']
        }
      }
    }
  });

/* ... */

  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-template');

  //git rebase will not work if there are uncommitted changes,
  //so we check for this before getting started
  grunt.registerTask('assertNoUncommittedChanges', function(){
    var done = this.async();

    grunt.util.spawn({
      cmd: "git",
      args: ["diff", "--quiet"]
    }, function (err, result, code) {
      if(code === 1){
        grunt.fail.fatal('There are uncommitted changes. Commit or stash before continuing\n');
      }
      if(code <= 1){ err = null; } //codes 0 & 1 are expected, not errors
      done(!err);
    });
  });


  //this task is a wrapper around the gitcommit task which
  //checks for updates before attempting to commit.
  //Without this check, an attempt to commit with no changes will fail
  //and exit the whole task.  I didn't feel this state (no changes) should
  //break the build process, so this wrapper task just warns & continues.
  grunt.registerTask('commitIfChanged', function(){
    var done = this.async();
    grunt.util.spawn({
      cmd: "git",
      args: ["diff", "--quiet", //just exists with 1 or 0 (change, no change)
        '--', grunt.config.data.gitcommit.bookmarkletUpdate.files.src]
    }, function (err, result, code) {
      //only attempt to commit if git diff picks something up
      if(code === 1){
        grunt.log.ok('committing new index.html...');
        grunt.task.run('gitcommit:bookmarkletUpdate');
      }else{
        grunt.log.warn('no changes to index.html detected...');
      }

      if(code <= 1){ err = null; } //code 0,1 => no error
      done(!err);
    });
  });

  grunt.registerTask('bookmarklet', 'build the bookmarklet on the gh-pages branch',
    [ 'assertNoUncommittedChanges',    //exit if working directory's not clean
      'gitcheckout:ghPages',           //checkout gh-pages branch
      'gitrebase:master',              //rebase for new changes
      'template:bookmarkletPage',      //(whatever your desired gh-pages update is)
      'commitIfChanged',               //commit if changed, otherwise warn & continue
      'gitcheckout:master'             //finish on the master branch
    ]
  );

/* ... */

};
```

That's it! 😊

## Additional Notes
Grunt tasks used here were [`grunt-template`](https://npmjs.org/package/grunt-template) and [`grunt-git`](https://npmjs.org/package/grunt-git) (the latter of which I contributed the rebase task to, for the purpose of this build).

**Why use rebase?:** We're using `rebase` here instead of `merge` because it keeps all the `gh-pages` changes at the tip of the `gh-pages` branch, which makes the changes on that branch linear and easy to read.    The drawback is that it requires `--force` every time you push your gh-pages branch, but it allows you to easily roll back your `gh-pages` stuff (roll back to the last version of your `index.html.tpl` e.g.) and this branch is never shared or merged back into master, so it seems a worthwhile trade.

**Is it realy a good idea to be switching branches, rebasing, etc. as part of an automated build?** Probably not. :)  But it's very useful in this case!

Please [let me know](mailto:sequoia.mcdowell@gmail.com) if you found this post useful or if you have questions or [feedback](https://twitter.com/_sequoia).
