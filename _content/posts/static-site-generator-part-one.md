---
title: "Let's Code It: Static Site Generator"
date: January 5, 2017
description: "Markdown in, HTML out... do we really need a framework for this? I Don't Think So!!"
originalUrl: "https://strongloop.com/strongblog/lets-code-it-static-site-generator/"
originalBlog: "StrongBlog"
---

Traditionally, if you wanted to create a blog or website that you can update easily without having to directly edit HTML, you'd use a tool like Wordpress. The basic flow for serving a website from a CMS like Wordpress is as follows:

1. Store content (e.g. "posts") in a database
2. Store display configuration (templates, CSS, etc.) separately
3. When a visitor requests a page, run a script to...
    1. Pull the content from the database
    2. Read the appropriate template
    3. Put them together to build page HTML
    4. Send HTML to the user

## Enter Static Site Generators

It occurred to some people that it didn't make sense to run step three *every single time* someone hit a page on their site. If step three (combining template with page content) were done in batch beforehand, all of the site's pages could be stored on disk and served from a static server! An application that takes this approach, generating "static" webpages and storing them as flat HTML files, is referred to as a Static Site Generator (or SSG). An SSG has the following benefits over a CMS: 

1. It eliminates the need to run a database server
2. It eliminates the need to execute PHP or any application logic on the server
3. It allows the site to be served from a highly performant file server like NGINX...
4. ...or any service that offers free static hosting (namely [Github Pages](https://help.github.com/articles/what-is-github-pages/))
5. Content written as flat markdown files can easily be tracked in a git repo & collaborated on thus

Points one and two dramatically reduce the attack surface of a web server, which is great for security. Point three (in conjunction with one and two) allows for greater site reliability and allows a server to handle much more traffic without crashing. Point four is very attractive from a cost perspective (as are one, two, and three if you're paying for hosting). The benefits of static site generators are clear, which is why many organization and individuals are using them, including [the publisher of this blog](https://strongloop.com/strongblog/new-life-for-loopback-documentation/) and [the author of this post](http://sequoia.makes.software/)!

## OK, Let's Use an SSG

There are many available SSG tools, one hundred and sixty two listed on [a site that tracks such tools](https://www.staticgen.com/) at the time of writing. One of the reasons there are so many options is that building an SSG isn't terribly complicated. The core functionality is:

1. Read markdown files (content)
2. Parse frontmatter (we'll look at this more later)
3. Convert markdown to HTML
4. Highlight code snippets
5. Insert the content into the appropriate template and render page HTML 
6. Write this HTML content to disk

I've simplified the process a bit here, but overall, this is a pretty straightforward programming task. Given libraries to do the heavy lifting of parsing markdown, highlighting code, etc., all that's left is the "read input files, process, write output files."

So can we write our own static site generator in Node.js? In this blog post we'll step through each of the steps outlined above to create the skeleton of an SSG. We'll skip over some non-page-generation tasks such as organizing images & CSS, but there's enough here to give you a good overview of what an SSG does. Let's get started!

# Building an SSG

## 1. Read Markdown Files

 No Wordpress means no WYSIWYG editor, so we'll be authoring our posts in a text editor. Like most static site generators, we will store our page content as [Markdown](https://en.wikipedia.org/wiki/Markdown) files. Markdown is a lightweight markup alternative to HTML that's designed to be easy to type, human readable, and typically used to author content that will ultimately be converted to and published as HTML, so it's ideal for our purpose here. A post written in markdown might look like this:

```md
# The Hotdog Dilemma

*Are hotdogs sandwiches*? There are [many people](https://en.wikipedia.org/wiki/Weasel_word) who say they are, including:

* Cecelia
* Donald
* James

## Further Evidence
... etc. ...
```

We'll put our posts in a directory called `_posts`. This will be like the "`Posts`" table in a traditional CMS, in the sense that it's where we'll look up our content when it's time to generate the site.

To read each file in the `_posts` directory, we need to list all the files, then read each one in turn. The [`node-dir`](https://www.npmjs.com/package/node-dir) package that does that for us, but the API isn't quite what we need, however, as it's callback based and oriented towards getting file names rather than compiling a array of all file contents. Creating [a wrapper function that returns a Bluebird promise containing an array of all file contents](https://gist.github.com/Sequoia/41a9c8be2ff2441357f41fddd3f68124) is tangential to the topic of this post, but let's imagine we've done so and we have an API that looks like this:

```js
getFiles('_posts', {match: /.*\.md/})
  .then(posts){
    posts.forEach(function(contents){
      console.log('post contents:');
      console.log(contents);
    })
  });
```

Because we're using [Bluebird promises](bluebirdjs.com/docs/api/) and our Promise result is an array, we can map over it directly:

```js
getFiles('_posts', {match: /.*\.md/})
  .map(function processPost(content){
    // ... process the post
    // ... return processed version
  })
  .map(nextProcessingFunction)
  //...
```

This set up will make it easy to write functions to transform out input to our output step by step, and apply those functions, in order, to each post.

## 2. Parse Frontmatter

In a traditional CMS, the `Posts` table holds not just the contents of the post, but also metadata such as its title, author, publish date, and perhaps a permanent URL or canonical link. This metadata is used both on the post page or in a page `<title>` and on index pages. In our flat-file system, all the information for a post must be contained in the markdown file for that post. We'll use the same solution for this challenge that is used by Jekyll and others: YAML frontmatter.

[YAML](http://yaml.org/) is a data serialization format that's basically like JSON but lighter weight. It looks like this:

```yaml
key: value
author: Sequoia McDowell
Object:
  key: http://example.com
  wikipedia: https://wikipedia.com
List:
  - First
  - Second
  - Third
```

"[Frontmatter](https://jekyllrb.com/docs/frontmatter/)" on Markdown files is an idea borrowed from Jekyll. Very simply, it means putting a block of YAML at the top of your markdown file containing metadata for that file. The SSG separates this YAML data from the rest of the file (the contents) and parses it for use in generating the page for that post. With YAML frontmatter, our post looks like this:

```md
---
title: The Hotdog Dilemma
author: Sequester McDaniels
description: Are hotdogs sandwiches? You won't believe the answer!
path: the-hotdog-dilemma.html
---

*Are hotdogs sandwiches*? There are [many people](https://en.wikipedia.org/wiki/Weasel_word) who say they are, including:

...
```

Trimming this bit of YAML from the top of our post and parsing it is easy with [`front-matter`](https://www.npmjs.com/package/front-matter), the node package that does exactly this! That means this step is as simple as `npm install`ing the library and adding it to our pipeline:

```js
const getFiles = require('./lib/getFiles');
const frontmatter = require('front-matter');

getFiles('_posts', {match: /.*\.md/})
  .map(frontmatter) // => { data, content }
  .map(function(parsedPost){
    console.log(post.data.title);   // "The Hotdog Dilemma"
    console.log(post.data.author);  // "Sequester McDaniels"
    console.log(post.content);      // "*Are hotdogs sandwiches*? There are [many people](https: ..."
  });
```

Now that our metadata is parsed and removed from the rest of the markdown content, we can work on converting the markdown to HTML. 

## 3. Convert Markdown to HTML

As mentioned, Markdown is a markup language that provides an easy, flexible way to mark up documents text in a human readable way. It was created by John Gruber in 2004 and introduced in [a blog post](http://daringfireball.net/projects/markdown/) that serves as the de-facto standard for the markdown format. This blog post would go on to be referenced by others who wished to build markdown parsers in Ruby, Javascript, PHP, and other languages.

The problem with having only a "de-facto" standard for a format like markdown is that this means *there is no actual, detailed standard*. The result is that over the years different markdown parsers introduced their own quirks and differences in parsing behavior, *as well as* extensions for things like [checklists](https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments) or [fenced code blocks](https://help.github.com/articles/basic-writing-and-formatting-syntax/#quoting-code). The upshot is this: there is no single "markdown" format-- the markdown you write for one parser **may not be be rendered the same by another parser**.

In response to this ambiguity, the [CommonMark](http://commonmark.org/) standard was created to provide "a strongly defined, highly compatible specification of Markdown." This means that if you use a CommonMark compatible parser in JavaScript and later switch to a CommonMark compatible parser in Ruby, you should get the exact same output.

The main JavaScript implementation of CommonMark is [`markdown-it`](https://github.com/markdown-it/markdown-it), which is what we'll use:

```js
const getFiles = require('./lib/getFiles');
const frontmatter = require('front-matter');
const md = require('markdown-it')('commonmark');

function convertMarkdown(post){
  post.content = md.render(post.content);
  return post;
}

getFiles('_posts', {match: /.*\.md/})
  .map(frontmatter) // => { data, content:md }
  .map(convertMarkdown) // => { data, content:html }
  .map(function(post){
    console.log(post.content);
    // "<p><em>Are hotdogs sandwiches</em>? There are <a href="https://en.wikipedia.org/wiki/Weasel_word">many people</a> who..."
  });
```

Now our markdown is HTML!

## 4. Highlight Code Snippets

We're writing a technical blog, so we want to display code with syntax highlighting. If I write:

~~~markdown
Here's a *pretty good* function:

```js
function greet(name){
  return "Hello " + name;
}
```
~~~

It should be output thus:

```html
<p>Here's a <em>pretty good</em> function:</p>

<pre><code class="language-js"><span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">greet</span>(<span class="hljs-params">name</span>)</span>{
  <span class="hljs-keyword">return</span> <span class="hljs-string">"Hello "</span> + name;
}
</code></pre>
```

These classes allow us to target each piece of the code (keywords, strings, function parameters, etc.) separately with CSS, as is being done throughout this blog post. The [`markdown-it` docs](https://github.com/markdown-it/markdown-it#syntax-highlighting) suggest using [`highlight.js`](https://highlightjs.org/) so that's what we'll do:

```js
const getFiles = require('./lib/getFiles');
const frontmatter = require('front-matter');
const md = require('markdown-it')('commonmark', {
  highlight: function (str, lang) {
    // "language" is specified after the backticks:
    // ```js, ```html, ```css etc.
    // "str" is the contents of each fenced code block
    return hljs.highlight(lang, str).value;
  }
});

// ... unchanged ...
```

Now we can used fenced code blocks as above. We're almost there!

## 5. Templating

There are plenty of templating libraries in JavaScript; we'll use [Pug](https://pugjs.org/api/getting-started.html) (formerly "Jade") here. First we'll create a template for posts:

```jade
//templates/post.pug
- var thisYear = (new Date()).getFullYear();
doctype html
html(lang='en')
  head
    title= title
    meta(name='description', content=description)
  body
    h1= title 
    | !{content}
    footer &copy; #{author} #{thisYear}
```

We won't dwell on the Pug syntax, but the important bits here are where are our data is injected into the template.  Note in particular:

1. `title= title` for the `<title>` tag
3. `h1= title` for the page header
4. `| !{content}` to output page contents, directly in the `body`, without escaping HTML

Next we must create a function that uses this template file to render a "post object" to HTML.

```js
//...
const pug = require('pug');
const postRenderer = pug.compileFile('./templates/post.pug');

//function for our posts promise pipeline:
function renderPost(){
  post.content = postRenderer(post);
  return post;
}   
```

We'll also need a function to flatten the post object for Pug's consumption

```js
// IN:  { content, data : { title, description, ...} }
// OUT: { content, title, description, ... }
function flattenPost(post){
  return Object.assign({}, post.data, { content : post.content });
}
```

Now we can plug these two new functions into our pipeline

```js
//...

getFiles('_posts', {match: /.*\.md/})
  .map(frontmatter) // => { data, content:md }
  .map(convertMarkdown) // => { data, content:html }
  .map(flattenPost)
  .map(renderPost)
  .map(post => {
    console.log(post.content); // '<!DOCTYPE html><html lang="en"><head><title> ...'
    console.log(post.path);    // 'the-hotdog-dilemma.html'
  })
```

Finally we're at the last step: writing posts to an output directory.

## 6. Writing HTML output

We're going to write our HTML files to a directory named `out`. This will contain the final output, ready to publish to a web server. Our function should, for each post, write the `post.content` to a path specified by `post.path`. Since we're using Bluebird already, we'll use the [promisified](http://bluebirdjs.com/docs/api/promise.promisifyall.html) version of the file system API.

```js
//...
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const outdir = './out'

function writeHTML(post){
  return fs.writeFileAsync(path.join(outdir, post.path), post.content);
} 
```

## Putting it All Together

Now we have a script that fulfills all of our original goals.

```js
// requires...
// utility functions...

//Read posts & generate HTML:

getFiles('_posts', {match: /.*\.md/}) // 1
  .map(frontmatter)                   // 2
  .map(convertMarkdown)               // 3
  .map(flattenPost)
  .map(renderPost)                    // 4, 5
  .map(writeHTML)                     // 6
  .then(function(){
    console.log('done!');
  })
  .catch(function(e){
    console.error('there was an error!')
    console.error(e)
  });
```

That's it!

# Conclusion and Next Steps

There is a lot we did not go over in this post, such as generating an index page, file watching and automatic re-running and publishing\*, but this post shows the *basics* of static site generation, and how the main logic can be captured on just a few dozen lines. (Admittedly, my production version is [a bit more complex](https://github.com/Sequoia/sequoia.github.com/blob/f0a4488c0979dee4dbcb16a8e30eef73620166e9/src/index.js).)

By writing your own tool you miss out out on the reusability of existing tools, but you gain *full control* over your blog build and *less reliance on a third party tool you don't control*. For me, the tradeoff of effort for control was worth it. Perhaps it is for you too!

\* *My [next post](https://strongloop.com/strongblog/lets-code-it-static-site-generator-with-rx-js/) will go over those features and more, so stay tuned!*