---
title: "Debugging JavaScript Interactively in Node.js (and Beyond!)"
date: November 02, 2016
hidden: true
description: TODO
originalUrl: TODO
originalBlog: "StrongBlog"
references: 
  - https://developers.google.com/web/tools/chrome-devtools/javascript/step-code
  - https://developers.google.com/web/tools/chrome-devtools/javascript/add-breakpoints
  - https://code.visualstudio.com/docs/runtimes/nodejs#_debugging-your-express-application
  - https://code.visualstudio.com/docs/editor/debugging
---

An "step through debugger" is a powerful tool that is very handy when your application isn't behaving the way you expect it to. A step through debugger (a.k.a. "interactive debugger" or just "debugger") allows you to pause code execution in your application in order to:

* inspect or alter application state
* see the code execution path ("call stack") that lead to the currently executing line of code, and
* inspect the application state at earlier points on that path

Interactive Debuggers are familiar to every Java developer (among others), but that they are much less well known in the JavaScript world. This is unfortunate, both because debuggers can be so helpful in diagnosing logic issues and becuase the debugging tools in JavaScript today are the best & easiest to use they've ever been! This post will introduce the Node.js debugging tools in [VS Code](https://code.visualstudio.com) in a way that's accessible to programmers who have never used a debugger before. *TODO: rework that sentence?*

## Why Use a Debugger?

Debuggers are useful when writing your own, original code, but they really show their value when you're working with an unfamiliar codebase. Being able to step through the code execution function by function can save hours of poring over sourcecode, trying to step through it in your head.

The ability to change the value of a variable at runtime allows you to play thru different scenarios without hardcoding values or restarting your application. Conditional breakpoints let you halt execution upon encountering an error to figure out how you got there. Even if using a debugger isn't part of your everday process, knowing how they work adds a powerful tool to your toolbox!

## Setting Up

We'll be using [VS Code](https://code.visualstudio.com), which has built-in Node.js debugging capabilities. In order to run code in the context of the VS Code debugger, we must first make VS Code aware of our Node.js project. For this demo I'll create a simple express app with [`express-generator`], you can follow along there or follow these steps with your own existing Node.js application.

~~~
$ npm install express-generator -g
$ express test-app   # create an application
$ cd test-app        
$ npm install
$ code .             # start VS Code
~~~

With VS Code open, we need to open the Debug pane by clicking the [bug icon](https://code.visualstudio.com/images/debugging_debugicon.png) in left sidebar menu. With the debug pane open, you may note that the gear icon at the top of the pane has a red dot over it. This is because there are currently no "launch configurations," configuration objects which tell VS Code how to run your application. Click the gear icon, select "Node.js," and VS Code will generate a boilerplate launch configuration for you.

There are two ways to attach the VS Code debugger to your application:

1. Set up a launch configuration and launch your app from within VS Code
2. Start your app from the console with `node --debug-brk your-app.js` and run the "Attach" launch configuration

The first approach normally requires some setup (which is beyond the scope of this post but you can [read about here](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations)), but because our `package.json` has a `run` script, VS Code automagically created a launch configuration based on that script. That means we should be able to simply click the green "run" button to start our application in the debugger.

![debug "launch" button with mouse pointer over it](/img/launch_button.png)

If all went well, you should see a new toolbar at the top of your screen with pause and play buttons (among others). The Debug Console at the bottom of the screen should tell you what command it ran & what output that command yielded, something like this:

~~~
node --debug-brk=18764 --nolazy bin/www 
Debugger listening on port 18764
~~~

When we load <http://localhost:3000> in a browser, we can see the express log messages in this same Debug Console:

~~~
GET / 304 327.916 ms - -
GET /stylesheets/style.css 304 1.313 ms - -
~~~

Now that we have the code running with the VS Code debugger attached, let's set some breakpoints and start stepping through our code!   

### Breakpoints

* Click to add
* Conditional Breakpoints
* Break on error

### Stepping

* In / out
* Step over
* Play/contine
* Stop
* Keyboard shortcuts

### Variable pane

* Inspecting
* Altering

### Call Stack

* What function called what: How did you get here?
* Click to see older variable states

### Watch Expressions

* Debug Console

## More

* Chrome!

\* *There's no specific term I've found for this common collection of application debugging tools so I'm using the term "interactive debugging" in this article.* 

################ JUST STUFF

* If you've ever written "console.log('line 102')" or similar: interactive debugging is useful
to you