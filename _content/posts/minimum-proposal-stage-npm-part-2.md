---
title: "What is \"JavaScript?\" Part 2: Solutions"
date: March 2, 2017
description: >
    "Bleeding edge" is all well and good, but can't we at least opt-in? Here's one weird trick to bring some transparency into the JavaScript module ecosystem with regard to new language features…
---

In my [last post](/what-is-javascript-part-1-the-problem) I outlined my concerns about lack of visibility into the incorporation of experimental features into popular JavaScript libraries. In short, the problems are:

1. The lack of a **clear, standard indicator** of when a library incorporates experimental language features
2. The inability to **consciously opt in** to using these features

In this post I'll outline my proposals for addressing these issues.

## Proposal 1a: `minimum-proposal-stage`

This idea is lifted from Composer, which has [`minimum-stability` property](https://getcomposer.org/doc/04-schema.md#minimum-stability) for projects. My idea is as follows:

1. Libraries indicate if they are using experimental language features and from what stage
2. Project authors specify the lowest proposal stage they're comfortable with
3. `npm install` warns if you are installing a library with features newer than desired

For example, if you only want "finished" (Stage 4) or higher features in your project, you add the following to your `package.json`:
 
 ```js
 "minimum-proposal-stage" : 4
 ```

Aurelia would indicate that it incorporates a Stage 2 proposed/experimental feature ([decorators](http://tc39.github.io/proposal-decorators/)) by adding the following to its `package.json` files:

```js
"lowest-proposal-stage" : 2
```

Upon attempting to install Aurelia, npm would warn you that the library's `lowest-proposal-stage` is lower than your `minimum-proposal-stage`. Basically: "hey! You're about to install a library with language features more experimental than you might be comfortable with!"

### Pros

* More granularity: This solution allows me to say "I am comfortable with Stage 4 (finalized, but not yet released) features, but nothing below that."

### Cons

* Requires users to learn more about the TC39 feature proposal process (perhaps this is actually a "pro"?)
* Would require libraries to update their `lowest-proposal-stage` property as features are adopted into the language

## Proposal 1b: `maximum-ecmascript-version`

This is like above, but pegged to ECMAScript versions.

Example: in my project, I don't want code *newer than* ES7 (the current released standard at the time of this writing), i.e. I don't want unreleased features:

```js
    "maximum-ecmascript-version" : 7
```

In the library's package file, they indicate that the library incorporates features that do not exist in any current version of ECMAScript:

```js
    "ecmascript-version" : "experimental"
```

npm would warn me before installing this package. This one, on the other hand, would install without complaint:

```js
    "ecmascript-version" : 5
```

because the `ecmascript-version` is lower than my maximum.

### Pros

* Simpler, easier to understand
* Released ES versions do not change, no need to update `ecmascript-version` if it's set to a released version

### Cons

* Not possible to allow some proposal stages but forbid others with this system

The two systems could also be used in conjunction with one another; I won't go into that possibility here.

## Possible Solution 2: Badges

Add badges to `README.md` files to indicate whether experimental features are used in the library. Here are some sample badges that use the proposal stage *names* rather than numbers:

*(Please excuse the largeness of these badges)*

![](/img/ES--proposal--stage-proposal-red.svg)
![](/img/ES--proposal--stage-draft-yellow.svg)
![](/img/ES--proposal--stage-finished-green.svg)

Alternately, the language version could be used:

![](/img/ecmascript--version-6-green.svg)
![](/img/ecmascript--version-7-yellow.svg)
![](/img/ecmascript--version-experimental-red.svg)

### Pros

* Does not require tooling (npm) updates&mdash;authors can start doing this right away
* Human readable

### Cons

* Not machine readable: npm cannot alert you if you attempt to install something with features less stable than you prefer

## Conclusion

Change is good, but stability is also good. Everyone should be able to easily choose to use *or not use* the latest and greatest JavaScript features and proposed features. Increasing visibility into experimental feature dependencies will...

1. Give users a better understanding of the JavaScript feature development process and what it means for something to be "JavaScript"
2. Allow users to consciously opt-in to using experimental language features
3. Allow those who prioritize stability to *opt-out* of using experimental language features
4. Give frazzled, overwhelmed users a bit of solid ground to stand on in the Churning Sea of JavaScript
5. Make JavaScript look a bit less scary to enterprise organizations

Please let me know what you think with a comment (below) or [on hackernews](https://news.ycombinator.com/item?id=13775534).