---
title: "Type Hinting in JavaScipt"
date: June 28, 2016
description: "What type is this object, what properties does it have, what arguments does this function take... there's a lot I don't miss about writing Java full-time, but boy do I miss this! Can we get these type hints in JavaScript? Let's find out!"
originalUrl: "https://strongloop.com/strongblog/type-hinting-in-javascript/"
originalBlog: "StrongBlog"
---


For small projects, the amount of overhead that goes into documenting every function parameter, return value, and variable can be overkill. If your program fits in one or two files, you can just pull up that other file & check whether that function returns a string or an array. When, however, your application starts to span dozens or hundreds of files, or the number of developers working on it begins to climb, this system can quickly lead to a huge mess. When you get to this point, it's very helpful to offload some of this "checking that function signature" to your [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) or text editor.

![example of tooltips and type hinting in JavaScript using VisualStudio Code](/img/typehint-example-1a.gif)

On projects of any size, code hinting reduces typos, makes coding easier, and obviates the need to check a module's documentation every few minutes. Programmers who use strongly typed languages like Java and IDEs like Eclipse take this sort of automated code-assistance for granted. But what about programmers who use JavaScript?

JavaScript is weakly typed, so when you declare `var animals;`, there's no way to know whether `animals` will be an array, a string, a function, or something else. If your IDE or editor doesn't know that `animals` will eventually be an array, there's no way for it to helpfully tell you that `animals` has the property `length` and the method `map`, among others. There's no way for the IDE to know it's an array... unless you tell it!

In this post we'll look at a couple ways to clue your IDE in to the **types** of the variables, function parameters, and return values in your program so it clue *you* in on how they should be used. We'll go over two ways to "tell" your IDE (and other developers) what types things are, and see how to load type information for third party libraries as well. Before we start *writing* type annotations, however, let's make sure we have a tool that can *read* them.

## Setting up The Environment

The first thing we'll need is a code editor that recognizes & supports the concept of "types" in JavaScript. You can either use a JavaScript oriented IDE such as [Webstorm](https://www.jetbrains.com/webstorm/) or [VisualStudio Code](https://code.visualstudio.com/), or if you already have a text-editor you like, you can search the web to find out if it has a type hinting plugin that supports JavaScript. There's one for [Sublime](http://sublimecodeintel.github.io/SublimeCodeIntel/) and [Atom](https://atom.io/packages/autocomplete-plus), among others.

If the goal is getting type hinting in JavaScript (and it is here), I use & recommend Visual Studio Code, the following reasons:

* It has code-hinting for JavaScript [built in](https://code.visualstudio.com/Docs/languages/javascript#_intellisense), no plugins needed
* It's from Microsoft, which has ample experience creating IDEs
* Microsoft is also the creator of [Typescript](//www.typescriptlang.org/) so it has excellent support for Typescript definitions, one of the tools we'll use herein
* It's [Open Source](https://github.com/Microsoft/vscode)
* It's free!

With VS Code installed, let's create a new project and get started!

## Built-in Types
I've used `npm init` to start a new JavaScript project. At this point, we already get quite a bit from our IDE, which has JavaScript APIs ([Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math), [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), etc.) and browser APIs ([DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [Console](https://developer.mozilla.org/en-US/docs/Web/API/Console), [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) etc.) built in.

Here's some of what we get out of the box:

![demo of type hinting for String, Math, Console, and Document](/img/typehint-built-in-stuff.gif)

Nice! But we're more interested in Node.js annotations and sadly, VS Code does not ship with those. Type declarations for Node.js core APIs do exist, however, in the form of [Typescript declaration files](https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html). We just need a way to add them to our workspace so VS Code can find them. Enter [Typings](https://www.npmjs.com/package/typings).

## Typings

Typings is a "Typescript Definition Manager", which means it helps us install the Typescript Defintions (or "Declarations") we need for our IDE to know what the JavaScript APIs we're working with look like. We'll look more at the format of Typescript Declarations later, for now we'll stay focused on our goal of getting our IDE to recognize Node.js core APIs.

Install `typings` thus:

```nohighlight
$ npm install --global typings
```

With `typings` installed on our system, we can add those Node.js core API type definitions to our project. From the project root:

```nohighlight
$ typings install dt~node --global --save
```

Let's break that command down:

1. `install` the `node` package...
2. ...from `dt~`, the [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) repository, which hosts a huge collection of typescript definitions
3. we add the `--global` switch because we want access to definitions for `process` and `modules` from throughout our project
4. Finally, the `--save` switch causes `typings` save this type definition as a project dependency in a `typings.json`, which we can check into our repo so others can insatll these same types. (`typings.json` is to `typings install` what `package.json` is to `npm install`.)

Now we have a new `typings/` directory containing the newly downloaded defintions, as well as our `typings.json` file.

### One More Step...

We now have these type definitions in our project, and VS Code loads all type definitions in your project automatically. However, it identifies the root of a JavaScript by the presence of a `jsconfig.json` file, and we don't have one yet. VS Code can usually guess if your project is JavaScript based, and when it does it will [display a little green lightbulb in the status bar](https://code.visualstudio.com/Docs/runtimes/nodejs#_adding-a-jsconfigjson-configuration-file), prompting you to create just such a `jsconfig.json` file. Click that button, save the file, start writing some Node and...

![demo of looking up core node.js api properties &amp; methods using external node.js typescript definition file](/img/typehint-node-core-apis.gif)

It works! We now get "Intellisense" code hints for all Node.js core APIs. Our project won't just be using Node core APIs though, we'll be pulling in some utility libraries, starting with [lodash](https://lodash.com/). `typings search lodash` reveals that there's a lodash definition from the `npm` source as well as `global` and `dt`. We want the `npm` version since we'll be consuming lodash as **module** included with `require('lodash')` and it will *not* be globally available.

```nohighlight
$ typings install --save npm~lodash
lodash@4.0.0
└── (No dependencies)

$ npm install --save lodash
typehinting-demo@1.0.0 /Users/sequoia/projects/typehinting-demo
└── lodash@4.13.1
```

Now we can require lodash and get coding:

![example demonstrating property and method lookup of a application dependency (lodash)](/img/typehint-lodash.gif)

So far we've seen how to install and consume types for Node and third party libraries, but we're going to want these annotations for our own code as well. We can achieve this by using JSDoc comments, writing our own Typescript Declaration files, or a combination of both.

## JSDoc Annotations
[JSDoc](http://usejsdoc.org/) is a tool that allows us to describe the parameters and return types of functions in JavaScript, as well as variables and constants. The main advantages of using JSDoc comments are:

1. They're lightweight & easy to get started with (just add comments to your JS)
2. The comments are human-readable, so the comments are useful even if you're reading the code on github or in a simple text editor
3. The syntax is very similar to [Javadoc](http://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) and for the most part fairly intuitive.

There are [many annotations](http://usejsdoc.org/index.html#block-tags) JSDoc supports, but you can get a long way just by learning a few, namely `@param` and `@return`. Let's annotate this simple function, which checks whether one string contains another string:

```js
function contains(input, search){
  return RegExp(search).test(input);
}

contains('Everybody loves types. It is known.', 'known'); // => true
```

With a function like this, it's easy to forget the order of arguments or their types. Annotations to the rescue!

```js
/**
 * Checks whether one string contains another string
 * 
 * @param {string} input   - the string to test against
 * @param {string} search  - the string to search for
 * 
 * @return {boolean}
 */
function contains(input, search){
  return RegExp(search).test(input);
}
```

While writing this, we realized it that this function actually works with regular expresssions as the `search` parameter as well as strings. Let's update that line to make clear that both types are supported:

```javascript
/** 
 * ...
 * @param {string|RegExp} search  - the string or pattern to search for
 * ...
 */
```

We can even add examples & links to documentation to help the next programmer out:

````javascript
/**
 * Checks whether one string contains another string
 * 
 * @example 
 * ```
 * contains("hello world", "world"); // true
 * ```
 * @example
 * ```
 * const exp = /l{2}/;
 * contains("hello world", exp);  // true
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
 * 
 * @param {string} input          - the string to test against
 * @param {string|RegExp} search  - the string or pattern to search for
 * 
 * @return {boolean}
 */
````

...and away we go!
 
![example of hinting function parameters &amp; types based on JSDoc comments](/img/typehint-jsdoc.gif)

JSDoc works great and we've only scratched the surface of what it can do, but for more complex tasks or cases where you're documenting a data structure that exists e.g. in a configuration file, typescript declaration files are often the better choice.
 
## Typescript Declarations

A typescript declaration file uses the extension `.d.ts` and describes the shape of an API, but *does not contain the actual API implementation*. In this way, they are very similar to the Java or PHP concept of an **Interface**. If we were writing Typescript, we would declare the types of our function parameters and so on right in our code, but JavaScript's lack of types makes this impossible. The solution: declare the types in an JavaScript library in a Typescript (definition) file that can be installed *alongside* the JavaScript library. This is the reason we installed the lodash type definitions separately from lodash.

Setting up external type definitions for an API you plan to publish and and registering them on the `typings` repository is a more involved task that we'll cover today, but you can read up about it [here](https://github.com/typings/typings/blob/master/docs/examples.md). For now, let's consider the case of a complex configuration file.

Imagine we have an application that creates a map and allows users to add features to that map. We'll be deploying these editable maps to different client sites, so we want be able to configure the **types of features** users can add and the **coordinates** to center the map on on a per-site basis.

Our `config.json` looks like this:

```json
{
  "siteName": "Strongloop",
  "introText":  {
    "title": "<h1> Yo </h1>",
    "body": "<strong>Welcome to StrongLoop!</strong>"
  },
  "mapbox": {
    "styleUrl": "mapbox://styles/test/ciolxdklf80000atmd1raqh0rs",
    "accessToken": "pk.10Ijoic2slkdklKLSDKJ083246ImEiOi9823426In0.pWHSxiy24bkSm1V2z-SAkA"
  },
  "coords": [73.153,142.621],
  "types": [
    {
      "name": "walk",
      "type": "path",
      "lineColor": "#F900FC",
      "icon": "test-icon-32.png"
    },
    {
      "name": "live",
      "type": "point",
      "question": "Where do you live?",
      "icon": "placeLive.png"
    }
    ...
```

We don't want to have to go read over this complex JSON file each time we want to find the name of a key or remember the type of a property. Furthermore, it's not possible to document this structure in the file itself because JSON does not allow comments.\* Let's create Typescript Declaration called `config.d.ts` to desribe this config object, and put it in a directory in our project called `types/`.

```typescript
declare namespace Demo{
  export interface MapConfig {
      /** Used as key to ID map in db  */
      siteName: string;
      mapbox: {
        /** @see https://www.mapbox.com/studio/ to create style */
        styleUrl: string;
        /** @see https://www.mapbox.com/mapbox.js/api/v2.4.0/api-access-tokens/ */
        accessToken: string;
      };
      /** @see https://www.mapbox.com/mapbox.js/api/v2.4.0/l-latlng/ */
      coords: Array<number>;
      types : Array<MapConfigFeature>;
  }

 interface MapConfigFeature {
    type : 'path' | 'point' | 'polygon';
    /** hex color */
    lineColor?: string;
    name : string;
    /** Name of icon.png file */
    icon: string;
  }  
}
```

You can read more [in the Typescript docs](https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html) about what all is going on here, but in short, this file:

1. Declares the `Demo` namespace, so we don't collide with some other `MapConfig` interface
2. Declares two interfaces, essentially schemas describing the structure and purpose of our JSON
3. Defines the `types` property of the first interface as an array whose members are `MapConfigFeature`s
3. Exports `MapConfig` so we can reference it from outside the file.

VS Code will load the file automatically because it's in our project, and we'll use the `@type` annotation to mark our `conf` object as a `MapConfig` when we load it from disk:

```js
/** @type {Demo.MapConfig} */
const conf = require('./config.js');
```

Now we can access properties of the configuration object & get the same code-completion, type info, and documentation hints! Note how in the following gif, VS Code identifies not only that `conf.types` is an array, but when we call an `.filter` on it, knows that each element in the array is a `MapConfigFeature` type object:

![example demonstrating looking up properties on an object based on a local Typescript Definition](/img/typehint-mapconfig.gif)

I have been very much enjoying the benefits of JSDoc, Typescript Declarations and the `typings` repository in my work. Hopefully this article will help you get started up and running with type hinting in JavaScript. If you have any questions or corrections, or if this post was useful to you, [please let me know](/contact)!

\* *There is in fact [a way to document the properties of json files](http://json-schema.org/), I hope to write about it in the future!*
