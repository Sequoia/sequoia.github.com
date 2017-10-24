---
title: "Higher Order Functions in ES6: Easy as a => b => c;"
date: January 11, 2016
description: "New language features can make an expression that was cumbersome
to write in ES5 easy in ES6, enabling and encouraging the use of this type of
expression. We’re going to look at one such case here: how arrow functions make
it easier to write higher-order functions in ES6."
originalUrl: "https://strongloop.com/strongblog/an-introduction-to-javascript-es6-arrow-functions/"
originalBlog: "StrongBlog"
---

ES6 is nigh! As more and more libraries & Thought Leaders start incorporating ES6 into their code, what used to be nice-to-know ES6 features are becoming required knowledge. And it’s not just new syntax – in many cases, new language features can make an expression that was cumbersome to write in ES5 easy in ES6, enabling and encouraging the use of this type of expression. We’re going to look at one such case here: how arrow functions make it easier to write higher-order functions in ES6.

A higher order function is a function that does one or both of the following:

1. takes one or more functions as arguments
2. returns a function as its result.

The purpose of this post is not to convince you to adopt this new style right
away, although I certainly encourage you to give it a try! The purpose is to
familiarize you with this style, so that when you run into it in someone’s
ES6-based library, you won’t sit scratching your head wondering what you’re
looking at as I did the first time I saw it. If you need a refresher in arrow
syntax, check out [this
post](https://strongloop.com/strongblog/an-introduction-to-javascript-es6-arrow-functions/) first.

Hopefully you’re familiar with arrow functions that return a value:

```javascript
const square = x => x * x;

square(9) === 81; // true
```

But what’s going on in the code below?

```javascript
const has = p => o => o.hasOwnProperty(p);
const sortBy = p => (a, b) => a[p] > b[p];
```

What’s this “p returns o returns o.hasOwnProperty…”? How can we use `has`?

## Understanding the syntax

To illustrate writing higher order functions with arrows, let’s look at a classic example: add.  In ES5 that would look like this:

```javascript
function add(x){
  return function(y){
    return y + x;
  };
}
 
var addTwo = add(2);
addTwo(3);          // => 5
add(10)(11);        // => 21
```

Our add function takes x and returns a function that takes y which returns y + x. How would we write this with arrow functions? We know that…

1. an arrow function definition is an expression, and
2. an arrow function *implicitly returns* the results of a single expression

…so all we must do is make the body of our arrow function another arrow function, thus:

```javascript
const add = x => y => y + x;
// outer function: x => [inner function, uses x]
// inner function: y => y + x;
```

Now we can create inner functions with a value bound to x:

```javascript
const add2 = add(2);// returns [inner function] where x = 2
add2(4);            // returns 6: exec inner with y = 4, x = 2
add(8)(7);          // 15
```

Our `add` function isn’t terribly useful, but it should illustrate how an outer
function can take an argument `(x)` and reference it in a function it returns.

## Sorting our users

So you’re looking at an ES6 library on github and encounter code that looks like this:

```javascript
const has = p => o => o.hasOwnProperty(p);
const sortBy = p => (a, b) => a[p] > b[p];
 
let result;
let users = [
  { name: 'Qian', age: 27, pets : ['Bao'], title : 'Consultant' },
  { name: 'Zeynep', age: 19, pets : ['Civelek', 'Muazzam'] },
  { name: 'Yael', age: 52, title : 'VP of Engineering'}
];
 
result = users
  .filter(has('pets'))
  .sort(sortBy('age'));
```

What’s going on here? We’re calling the [Array prototype’s sort and filter
methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype#Methods), each of which take a single function argument, but instead of writing function expressions and passing them to filter and sort, we’re calling functions that return functions, and passing those to filter and sort.

Let’s take a look, with the expression that returns a function underlined in each case.

#### Without higher order functions

```javascript
result = users
  .filter(x => x.hasOwnProperty('pets')) //pass Function to filter
  .sort((a, b) => a.age > b.age);        //pass Function to sort
```

#### With higher order functions

```javascript
result = users
  .filter(has('pets'))  //pass Function to filter
  .sort(sortBy('age')); //pass Function to sort
```

In each case, `filter` is passed a function that checks if an object has a property called “pets.”

## Why is this useful?

This is useful for a few reasons:

* It reduces repetitive code
* It allows for easier reuse of code
* It increases clarity of code meaning

Imagine we want only users with pets **and with titles**. We could add another function in:

```javascript
result = users
  .filter(x => x.hasOwnProperty('pets'))
  .filter(x => x.hasOwnProperty('title'))
  ...
```

The repetition here is just clutter: it doesn’t add clarity, it’s just more to read and write. Compare with the same code using our `has` function:

```javascript
result = users
  .filter(has('pets'))
  .filter(has('title'))
  ...
```

This is shorter and easier to write, and that makes for fewer typos. I consider this code to have greater clarity as well, as it’s easy to understand its purpose at a glance.

As for reuse, if you have to filter to pet users or people with job titles in many places, you can create function to do this and reuse them as needed:

```javascript
const hasPets = has('pets');
const isEmployed = has('title');
const byAge = sortBy('age');
 
let workers = users.filter(isEmployed);
let petOwningWorkers = workers.filter(hasPets);
let workersByAge = workers.sort(byAge);
```

We can use some of our functions for single values as well, not just for filtering arrays:

```javascript
let user = {name: 'Assata', age: 68, title: 'VP of Operations'};
if(isEmployed(user)){   // true
  //do employee action
}
hasPets(user);          // false
has('age')(user);       //true
```

## A Step Further

Let’s make a function that will produce a filter function that checks that an
object has a **key** with a certain **value**. Our `has` function checked for a key, but to check value as well our filter function will need to know two things (key and value), not just one. Let’s take a look at one approach:

```javascript
//[p]roperty, [v]alue, [o]bject:
const is = p => v => o => o.hasOwnProperty(p) && o[p] == v;
 
// broken down:
// outer:  p => [inner1 function, uses p]
// inner1: v => [inner2 function, uses p and v]
// inner2: o => o.hasOwnProperty(p) && o[p] = v;
```

So our new function called “is” does three things:

1. Takes a **property** name and returns a function that…
2. Takes a **value** and returns a function that…
3. Takes an **object** and tests whether the object has the property specified with the value specified, finally returning a boolean.

Here is an example of using this `is` to filter our users:

```javascript
const titleIs = is('title');
// titleIs == v => o => o.hasOwnProperty('title') && o['title'] == v;
 
const isContractor = titleIs('Contractor');
// isContractor == o => o.hasOwnProperty('title') && o['title'] == 'Contractor';
 
let contractors = users.filter(isContractor);
let developers  = users.filter(titleIs('Developer'));
 
let user = {name: 'Viola', age: 50, title: 'Actress', pets: ['Zak']};
isEmployed(user);   // true
isContractor(user); // false
```

## A note on style

Scan this function, and note the time it takes you to figure out what’s going on:

```javascript
const i = x => y => z => h(x)(y) && y[x] == z;
```

Now take a look at this same function, written slightly differently:

```javascript
const is = prop => val => obj => has(prop)(obj) && obj[prop] == val;
```

There is a tendency when writing one line functions to be as terse as possible,
at the expense of readability. Fight this urge! Short, meaningless names make
for cute-looking, **hard to understand** functions. Do yourself and your fellow coders a favor and spend the extra few characters for meaningful variable and function names.

## One more thing. . .

What if you want to sort by age in descending order rather than ascending? Or find out who’s not an employee? Do we have to write new utility functions `sortByDesc` and `notHas`? No we do not! We can wrap our functions, which return Booleans, with a function that inverts that boolean, true to false and vice versa:

```javascript
//take args, pass them thru to function x, invert the result of x
const invert = x => (...args) => !x(...args);
const noPets = invert(hasPets);
 
let petlessUsersOldestFirst = users
  .filter(noPets)
  .sort(invert(sortBy('age')));
```

## Conclusion

Functional programming has been gaining momentum throughout the programming world and ES6 arrow functions make it easier to use this style in JavaScript. If you haven’t encountered FP style code in JavaScript yet, it’s likely you will in the coming months. This means that even if you don’t love the style, it’s important to understand the basics of this style, some of which we’ve gone over here. Hopefully the concepts outlined in this post have helped prepare you for when you see this code in the wild, and maybe even inspired you to give this style a try!

# Comments

> I think you did a very good (difficult to do a great) job, particularly with your examples. Your post motivates me to dive deeper into FP.

\- Brent Enright, <time datetime="2017-08-25 17:55:54 UTC">August 25, 2017</time>

Thanks Brent!! Feedback like this makes my day!