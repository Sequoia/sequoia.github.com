---
layout: post
title: "Bookmarklet Publishing with Grunt &amp; Github Pages"
description: ""
category:
tags: [grunt, github, javascript]
---
{% include JB/setup %}
A while ago I created a bookmarklet to anonymize Facebook for screenshots, [the Afonigizer](http://sequoia.github.io/afonigizer/). To distribute it, I chose to use [Github Pages](http://pages.github.com/), Github's free hosting service.  Here I'll explain my build process for the bookmarklet (Well, first a few notes.  [Here's the meat of the article](#the-build) in case that's all you need.)

## A Few Notes
### Bookmarklet recap
A bookmarklet is an anchor tag with javascript in the href that gets executed when the bookmarklet is clicked.  Prefix javascript with `javascript:` & **wrap main function call in `void()` to prevent pageload** (like `return false` on click bindings).  A simple example looks like this:

```html
<a href='javascript:void(alert("@_sequoia"));'>Top Gun</a>>
```
This code produces the following bookmarklet: <a href='javascript:void(alert("@_sequoia"));'>Top Gun</a>, which can be dragged to your bookmark toolbar & clicked on any site.

### Using modules in bookmarklets
If you have a **[module](http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html)** and the **constructor returns an object** and the **object has a function property called `doIt`** which executes your bookmarklet action, your bookmarklet might look more like this:

```html
<a href="javascript:
 function MyModule(){ return { doIt: function(){/*bookmarklet action*/} } };
 var myMod = myMod || new MyModule();
 void(myMod.doIt());">Marklet</a>
```
This latter pattern is useful if you want to only run your initialization steps once (in the constructor) then only run `doIt` on subsequent clicks.  It also allows you to preserve some state in `myMod`.  Forboth of these reasons (as well as testability) I use this[ module bookmarklet setup](https://github.com/Sequoia/afonigizer/blob/gh-pages/index.html.tpl) with the Afonigizer.  Furthermore, using a module pattern will make it easier to conver the bookmarklet into a plugin later on.

### Why write a bookmarklet/why not a plugin?
Bookmarklets have little overhead & work cross-browser, you don't have to manage or learn different plugin formats so it's quick to get started.  You can always build it out into a plugin later, and with the build automated it's much easer to publish to multiple platforms (bookmarklet, Firefox plugin, chrome plugin, etc.).

### Github Pages
[Github Pages](http://pages.github.com/) is a service from github that allows you to easily host a static website associated with a Github repository.

To use Github Pages, simply create a new branch called `gh-pages`, add an `index.html`, and push it to Github.  Github will then start serving your `index.html` from `<your username>.github.io/<project name></project>`. [See here](https://help.github.com/categories/20/articles) for more.
### Grunt
[Grunt](http://gruntjs.com/) is a javascript build tool. There are [many prebuilt "tasks"](http://gruntjs.com/plugins) that do things like lint, minify, concat, and test your javascript.

<h2 id="the-build">The Build</h2>
So you have your bookmarklet written, linted, minified, etc. & committed to your `master` branch, and you're ready to publish it to the web as a bookmarklet.  The steps we need to get the updated bookmarklet module published to the web are as follows

2. [Checkout the `gh-pages` branch](#checkout)
3. [Rebase it onto master](#rebase)
4. [Insert the updated javascript into your index.html](#template)
5. [Commit the new index.html](#commit)
6. Switch back to the `master` branch (set up in [step 1](#checkout))
7. Push the code to github (this will be left as an exercise for the reader :))

We'll look at these grunt tasks one by one then tie them all together at the end.

### Prerequisites and setup
The build below assumes that you have a minified version of your bookmarklet script at `dist/marklet.min.js` (we're using the simpler, non-module setup from above). Example:

```javascript
(function(){var a="@",b="_",c="sequoia";alert(a+b+c);})();
```

1. If not done already, create a `gh-pages` branch.
2. Create your `index.html` template file on the gh-pages branch and commit it.  This is the file that will be combined with your javascript to produce the actual, finished `index.html`.  We'll call it `index.html.tpl`. You can [look at mine](https://github.com/Sequoia/afonigizer/blob/gh-pages/index.html.tpl) or start with this bare-bones example:

```html
<!-- filename: index.html.tpl -->
<html><body>
	<a href='javascript:void(<%= marklet %>);'>Bookmarklet!</a>
</body></html>
```

<h3 id="checkout">Checkout `gh-pages`</h3>
```javascript
gitcheckout: {
  ghPages : { options : { branch : 'gh-pages' } },
  master : { options : { branch : 'master' } }
}
```

Here we'll set up tasks to switch to gh-pages and back. Requires [grunt-git](https://npmjs.org/package/grunt-git).

<h3 id="rebase">Rebase onto master</h3>
```javascript
gitrebase: {
  master : { options : { branch : 'master' } }
}
```
Here's where we get the updated marklet from the master branch. This task also requires `grunt-git`.


<h3 id="template">Place your javascript into your html</h3>

```javascript
template : {
  'bookmarkletPage' : {
    options : {
      data : function(){
        return {
          marklet : fs.readFileSync('dist/marklet.min.js','ascii').trim()
        };
      }
    },
    files : {
      'index.html' : ['index.html.tpl']
    }
  }
}
```
In this case the only "data" in the template data is the bookmarklet script as a string.
<h3 id="commit">Commit</h3>

```javascript
gitcommit: {
  bookmarklet : {
    options : { message : 'updating marklet' },
    files :  { src: ['index.html'] }
  }
}
```

<h3 id="bookmarklet-task">Put it all together</h3>
```
grunt.registerTask('bookmarklet', 'build the bookmarklet on the gh-pages branch',
  [ 'gitcheckout:ghPages',
    'gitrebase:master',
    'template:bookmarklet',
    'gitcommit:bookmarklet',
    'gitcheckout:master']
);
```
That's it! 😊

## Additional Notes
I have ommitted a couple "safety" steps to simplify this explantion and because they are of questionable necessity.  They are both `git-diff` checking tasks.

The first makes sure there are no changes on your current branch before you start- such changes will make the rebase fail.  The second checks for changes in `index.html` before committing it- attempting to commit with no changes causes git to error & grunt to fail.  As long as you confirm that a) your have no uncommitted changes & b) you made *some* change to your bookmarklet before starting, these checks are uneccessary. [See my Gruntfile](https://github.com/Sequoia/afonigizer/blob/master/Gruntfile.js) for these additional safety checks.

I used the module pattern mentioned above, so my template looks a little different (call to `moduleObj.doIt()` is from the **template** not in the `.js` file).  If you are using the the simpler setup (script to execute each click), be aware that you might need to strip a final semicolon or do some other fiddling to make it sit properly in the `void` function.

**Why use rebase?:** We're using `rebase` here instead of `merge` because it keeps all the `gh-pages` changes at the tip of the `gh-pages` branch, which makes the changes on that branch linear and easy to read.    The drawback is that it requires `--force` every time you push your gh-pages branch, but it allows you to easily roll back your `gh-pages` stuff (roll back to the last version of your `index.html.tpl` e.g.) and this branch is never shared or merged back into master, so it seems a worthwhile trade. 

[Drop me a line](mailto:sequoia.mcdowell@gmail.com) with questions or [feedback](https://twitter.com/_sequoia).
