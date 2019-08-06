---
title: "Two Painful Ways to Misuse JavaScript's Symbol Descriptions"
date: August 6, 2019
description: >
    ES2019 introduced a new way to access the (non-unique) description property of (unique) Symbol objects. As with any new JS feature, every developer's first question is "how can I shoot myself in the foot with this?" Read and find out!
hidden: true
---

[Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) were introduced in ECMAScript 6 (ES2015) as a way to create truly unique values in JavaScript applications. They have several cool features, but the main point of Symbols is that they are **unique**. Although multiple Symbols can be created with identical descriptions (e.g. `x = Symbol('a'); y = Symbol('a')`), the Symbols themselves are different. The description is just a helpful label, almost like a comment: it cannot be directly accessed from the Symbol once it's created.

[Until ES2019!](https://blog.tildeloop.com/posts/javascript-what%E2%80%99s-new-in-es2019#symboldescription) Now the Symbol's description property can be directly accessed via `mySymbol.description`. Why is useful? Who cares!<sup>1</sup> _This_ blog post is not about what's useful, it's about misusing JavaScript for pain and heartache! So without further ado,

## Method 1: Comparing Symbols by Description 

As mentioned, Symbols are **unique**.<sup>2</sup> This means if one is created by a vendor:

```js
// vendor/x.js
catalog_id = Symbol('cat_id');
module.export = catalog_id;
```

...and then another by me...

```js
// lib/y.js
cat_id = Symbol('cat_id');
module.export = cat_id;
```

they will be unique values:

```js
catalog_id = require('vendor/x.js');
cat_id = require('lib/y.js');

const item = {};
item[catalog_id] = 123;

// Check if catalog id is set:
// 1. get the properties where the keys are symbols:
const symbolProps = Object.getOwnPropertySymbols(item);
// 2. see if that array contains catalog id
hasCatalogId = symbolProps.contains(cat_id);
```

`hasCatalogId` is `false`! Boo! My Symbol is supposed to reference the same property as that referenced by the Symbol created in `vendor/x.js`! I created mine to match theirs (they have the same description). There must be a way to see that they are actually "the same"... `Symbol.prototype.description` to the rescue:

```js
//... require(), const item etc.

// 1. get the DESCRIPTION of properties where the keys are symbols:
const symbolProps = Object.getOwnPropertySymbols(item)
  .map(symb => symb.description);
// 2. see if that array contains catalog id
hasCatalogId = symbolProps.contains(cat_id.description);
```

Problem solved: `hasCatalogId` is now (correctly) `true`!

## Method 2: Serializing Using Description

In this case, I have Symbols representing the unique roles my user's might have (author, admin, etc).

```js
const admin = Symbol('admin');
const author = Symbol('author');
```

I also have a collection of users with their roles defined:

```js
const users = [
    {name: 'vimukt', role: admin},
    {name: 'danilo', role: admin}
];

log(users[0].role === admin); // true
log(users[0].role.description); // "admin"
```

I want to serialize these for some reason:

```js
usersJSON = JSON.stringify(users);
```

But when I deserialize, my roles are gone:

```js
deserialized = JSON.stringify(usersJSON);
log(deserialized[0].role); // undefined
```

`JSON.stringify` is refusing to converty my Symbol values to strings!! Don't worry, with a little trickery, we can outsmart it:

```js
function serializeWithRoles(users){
    return JSON.stringify(
        users.map(user => {
            // convert the role Symbols to strings so they serialize
            user.role = user.role.description;
            return user;
        })
    )
}

function deserializeWithRoles(userJSON){
    return JSON.parse(userJSON)
        .map(user => {
            // convert role strings back to symbols
            user.role = Symbol(user.role);
            return user;
        });
}
```

Let's try it:

```js
const usersJSON = serializeWithRoles(users);
const deserialized = deserializeWithRoles(usersJSON);

log(deserialized[0].role); // Symbol(admin)
log(deserialized[0].role.description); // "admin"
```

Et voilà! Serializing & deserializing with our roles "works", and we have Symbols at the finish, just as we did at the start.

## Spoilers: Why These Methods Are Bad

TODO

## Footnotes

<sup>1</sup> *If you do want to learn more about the uses of Symbols, see [this informative article](https://www.keithcirkel.co.uk/metaprogramming-in-es6-symbols/).*<br>
<sup>2</sup> *With the exception of global symbols find-or-create'ed using [`Symbol.for`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for), but these will never have the same value as a Symbol created using `Symbol()`.