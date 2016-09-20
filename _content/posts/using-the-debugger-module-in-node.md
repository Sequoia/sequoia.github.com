---
hidden: true
title: "Let's Code It: The `debug` Module"
date: September 15, 2016
description: "What if, instead of commenting out or deleting our useful log statements when we're not using them, we could turn them on when we need them and off when we don't? The `debug` module lets us do that-- but how does it work? Let's find out!"
---

I did some fun stuff with the `debug` module recently for a web map project. I needed to understand the somewhat complex interactions between events in [Leaflet.js](http://leafletjs.com/) in order to figure out what events to attach to... but that's the next post. Before I get to that, I want to go over the `debug` module itself.

## A trip down memory lane...

`console.log`: the JavaScript programmer's oldest friend*. `console.log` was probably one of the first things you learned to use to debug JavaScript, and while there are [plenty](https://code.visualstudio.com/docs/runtimes/nodejs#_debugging-your-express-application) of [more powerful tools](https://developer.mozilla.org/en-US/docs/Tools/Debugger), `console.log` is still useful to say "event fired", "sending the following query to the database...", etc..

So we write statements like ``console.log(`click fired on ${event.target}`)``. But then we're not working on that part of the application anymore and those log statements just make noise, so we delete them. But then we *are* working on that bit again later, so we put them back-- and this time when we're finished, we just comment them out, instead of moving them. Before we know it our code looks like this:

```js
fs.readFile(usersJson, 'utf-8', function (err, contents){
  // console.log('reading', usersJson);
  if(err){ throw err; }
  var users = JSON.parse(contents);
  // console.log('User ids & names :');
  // console.log(users.map(user => [user.id, user.name]));
  users.forEach(function(user){
    db.accounts.findOne({id: user.id}, function(err, address){
      if(err){ throw err; }
      var filename = 'address' + address.id + '.json';
      // console.log(JSON.parse('address'));
      // console.log(`writing address file: ${filename}`)
      fs.writeFile(filename, 'utf-8', address, function(err){
        if(err){ throw err; }
        // console.log(filename + ' written successfully!');
      });
    });
  });
});
```

## "There's got to be a better way!"

What if, instead of commenting out or deleting our useful log statements when we're not using them, we could turn them on when we need them and off when we don't? This is a pretty simple fix:

```js
function log(...items){   //console.log can take multiple arguments!
  if(typeof DEBUG !== 'undefined' && DEBUG === true){
    console.log(...items)
  }
}
```
*NB: Using ES6 features [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) and [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator) in this function*

Now we can replace our `console.log()` statements with `log()`, and by setting `DEBUG=true` or `DEBUG=false` in our code, we can turn logging on or off as needed! Hooray! Well, actually, there are still a couple problems...

## Problem 1: Hardcoding

In our current system, `DEBUG` must be hardcoded, which is bad because

1. it can't be enabled or disabled without editing the codebase
2. it can accidentally be checked into our code repository enabled

We can fix that by setting `DEBUG` to true or false somewhere outside our script, and reading it in. In node it would make sense to use an [environment variable](https://nodejs.org/api/process.html):

```js
const DEBUG = process.env.DEBUG; // read from environment

function log(...items){
// ...
```

Now we can `export DEBUG=true` on our dev machine to turn it on all the time. Alternately, we can turn /j #it on by [setting an environment variable just for one process](http://manpages.ubuntu.com/manpages/precise/en/man1/bash.1.html#contenttoc22) when we launch it (shell command below):
```sh
$ DEBUG=true node my-cool-script.js
```

If we want to use our debugger in the browser, we don't have `process.env`, but we *do* have [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage):

```js
var localEnv; //where do we read DEBUG from?

if(process && process.env){                //node
  localEnv = process.env;
}else if(window && window.localStorage) {  //browser
  localEnv = window.localStorage;
}

const DEBUG = localEnv.DEBUG;

function log(...items){
  // ...
```

Now we can set `DEBUG` in `localStorage` using our browser console...

```
> window.localStorage.DEBUG = true;
```

...reload the page, and debugging is enabled! Set `window.localStorage.DEBUG` to false & reload and it's disabled again.

## Problem 2: All or Nothing

With our current setup, we can only chose "all log statements on" or "all log statements off." This is OK, but if we have a big application distinct parts, and we're having a database problem, it would be nice to just turn on database-related debug statements, but not others. If we only have one debugger and one debug on/off switch (`DEBUG`), this isn't possible, so we need:

1. Multiple debug functions
2. Multiple on/off switches

Let's tackle the second problem first. Instead of a boolean, let's make debug an array of keys, each representing a debugger we want turned on:

```js
DEBUG = ['database'];        // just enable database debugger
DEBUG = ['database', 'http'];// enable database & http debuggers
DEBUG = undefined;           // don't enable any debuggers
```

We can't set arrays as environment variables, but we can set it to a string...
```
$ DEBUG=database,http node my-cool-script.js
```

...and it's easy to build an array from a string...

```js
// process.env.DEBUG = 'database,http'
DEBUG = localEnv.DEBUG.split(',');

DEBUG === ['database', 'http'] // => true 
```

Now we have an array of keys for debuggers we want enabled. The simplest way to allow us to enable just http or just database debugging would be to add an argument to the `log` function, specifying which "key" each debug statement should be associated with:

```js
function log(key, ...items){
  if(typeof DEBUG !== 'undefined' && DEBUG.includes(key)){ 
    console.log(...items)
  }
}

log('database','results recieved');             // using database key
log('http','route not found', request.url);     // using http key
```
*NB: [`Array.prototype.includes`](http://kangax.github.io/compat-table/es2016plus/#test-Array.prototype.includes_Array.prototype.includes) only exists in newer environments.*

Now we can enable enable and disable http and database debug logging separately! Passing a key *each time* is a bit tedious however, so let's revisit the proposed solution above, "Multiple debug functions." To create a `logHttp` function, we basically need a pass-through that takes a message and adds the `http` "key" before sending it to log:

```js
function logHttp(...items){
  log('http', ...items);
}

logHttp('foo'); // --> log('http', 'foo');
```

Using [higher-order functions](https://strongloop.com/strongblog/higher-order-functions-in-es6easy-as-a-b-c/) (in this case a function that returns a function), we can make a "factory" to produce debugger functions bound to a certain key:

```js
function makeLogger(fixedKey){
  return function(...items){
    log(fixedKey, ...items)
  }
}
```

Now we can easily create new "namespaced" `log` functions and call them separately:

```js
const http = makeLogger('http');
const dbDebug = makeLogger('database');

dbDebug('connection established');     // runs if "database" is enabled
dbDebug('Results recieved');           // runs if "database" is enabled

http(`Request took ${requestTime}ms`); // runs if "http" is enabled 
``` 

## That's it!

That gets us just about all the way to the [`debug` module](https://github.com/visionmedia/debug)! It has a couple more features than what we created here, but this covers the main bits. I use the `debug` module in basically all projects & typically start using it from day 1: if you *never* put `console.log` statements in your code you have nothing to "clean up," and those debug log statements you make during active development can be useful later on, so why not keep them?

Next steps: go check out the the [`debug` module](https://github.com/visionmedia/debug). In the next post I'll go over some advanced usage. Thanks for reading!

\**[second oldest](https://developer.mozilla.org/en-US/docs/Web/API/Window/alert) ;)*