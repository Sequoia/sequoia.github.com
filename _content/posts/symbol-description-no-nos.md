---
title: "Two Painful Ways to Misuse JavaScript's Symbol Descriptions"
date: August 6, 2019
tags: javascript, antipatterns
description: >
    ES2019 introduced a new way to access the (non-unique) description property of (unique) Symbol objects. As with any new JS feature, every developer's first question is "how can I shoot myself in the foot with this?" Read and find out!
---

I was reading [an article on new features in ES2019](https://blog.tildeloop.com/posts/javascript-what%E2%80%99s-new-in-es2019#symboldescription) earlier today, and one jumped out at me: `Symbol.prototype.description`. "Wow," I thought, "this feature will be *really* easy to misuse!" In this post, we'll look at a couple of ways *you* can start misusing this cutting edge JavaScript feature today!

## Background

[Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) were introduced in ECMAScript 6 (ES2015) as a way to create truly unique values in JavaScript applications. They have several cool features, but the main point of Symbols is that they are **unique**. Although multiple Symbols can be created with identical descriptions (e.g. `x = Symbol('a'); y = Symbol('a')`), the Symbols themselves are different. The description is just a helpful label, almost like a comment: it cannot be directly accessed from the Symbol once it's created.

Until ES2019! Now the Symbol's description property can be directly accessed via `mySymbol.description`. Why is useful? Who cares!<sup id="footnote-one">[1](#footnotes)</sup> _This_ blog post is not about what's useful, it's about misusing JavaScript for pain and heartache! So without further ado,

## Method 1: Comparing Symbols by Description 

As mentioned, Symbols are **unique**.<sup id="footnote-two">[2](#footnotes)</sup> This means if one is created by a vendor:

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

// 1. get the object keys that are symbols:
const symbolProps = Object.getOwnPropertySymbols(item);

// 2. see if that array contains catalog id
hasCatalogId = symbolProps.contains(cat_id);
```

`hasCatalogId` is false! What gives?? The Symbol I defined in `lib/y.js` is supposed to reference the same property as that referenced by the Symbol created in `vendor/x.js`! I created mine to match theirs (they have the same description). There must be a way to see that they are actually "the same"... `Symbol.prototype.description` to the rescue:

```js
//... require(), const item etc.

// 1. get the DESCRIPTION of object keys that are symbols:
const symbolPropDescriptions = Object.getOwnPropertySymbols(item)
  .map(symb => symb.description);

// 2. see if that array contains catalog id
hasCatalogId = symbolPropDescriptions.contains(cat_id.description);
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
deserialized = JSON.parse(usersJSON);
log(deserialized[0].role); // undefined
```

`JSON.stringify` is refusing to convert my Symbol values to strings! Don't worry, with a little trickery, we can get around this limitation:

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

### Comparing Symbols by Description

This is bad because it breaks a major feature of Symbols: the fact that they're unique. The proper way to use a Symbol defined elsewhere is to import the that Symbol and use it directly. If it's not not exported, it probably is not meant to be used externally. If it *is* meant to be used externally but was not exported, that's a bug.

If you don't care about using the exact same copy of a Symbol object property or Symbol value, or you want to define such values in multiple places and compare them, a string is probably more appropriate. If you want to use the same Symbol but access it from multiple places using the description, use [`Symbol.for`]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for) (note the caveats about namespacing this type of Symbol!).


### Serializing Using Description

The fact that the built-in `JSON.stringify` method refuses to convert Symbols to a string (JSON) representation gives us a hint that doing this is probably not a good idea. In fact, it's impossible to convert a Symbol into a string and then back into the same Symbol because a) the Symbol exists uniquely only within the context of a *running* application and b) while the Symbol description may be a string which can be serialized (as we did above), **the description is not the symbol**.

!["The Treachery of Images" by René Magritte](/img/pipe.jpeg)

Attempting to serialize and deserialize Symbols, which exist only in the context of a running application, cannot work. In our example above, while the `admin` Symbol is "serialized" by description string then deserialized by passing the string to `Symbol()`, **each of the Symbols created in the deserialization is unique**. This means that while `users[0].role === users[1].role` was true before serializing & deserializing, it is false after. You could use `Symbol.for` to get around this, but at that point the Symbol is no more reliable or unique that its description, in which case why not just use the description.

## Conclusion

When I read of the introduction of `Symbol.prototype.description`, the antipatterns it would make easier were the first thing that came to mind. I am sure both of the methods I describe above will exist in the wild soon, so when you come across one of them remember: you heard it here first!

## Footnotes

<sup>1</sup> *If you do want to learn more about the uses of Symbols, see [this informative article](https://www.keithcirkel.co.uk/metaprogramming-in-es6-symbols/).* <a href="#footnote-one" title="back up">⤴</a><br>
<sup>2</sup> *With the exception of global symbols find-or-create'ed using [`Symbol.for`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for), but these will never have the same value as a Symbol created using `Symbol()`.* <a href="#footnote-two" title="back up">⤴</a>