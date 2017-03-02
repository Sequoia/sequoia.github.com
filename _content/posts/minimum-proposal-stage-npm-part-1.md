---
title: "What is \"JavaScript?\" Part 1: The Problem"
date: March 2, 2017
description: >
    In the age of Babel, babel-plugins, and widespread transpilation, what does it mean for something to be JavaScript, and why does that question matter?
---

As [Babel](http://babeljs.io/) took over the JavaScript scene, it became possible to use features from the newest ECMAScript specification before browsers (or Node) had implemented them. It *also* became possible to use *proposed* ECMAScript features before they'd been finalized and officially incorporated into ECMAScript. While this allowed lots of exciting new developments, it introduced a good bit of confusion as well. Can you tell me which of the following is "just JavaScript/ECMAScript"?

1. `let n = { x, y, ...z };`
2. `Promise.resolve(123).then(::console.log);`
3. `Promise.resolve(2).finally(() => {})`
4. `@observable title = "";`
5. `'[1...10]'.forEach(num => console.log(num))`

If you said "none of these are 'just JavaScript'," you were right! The first four are *proposed* features. Number five is a feature from another language, but [you can use it with babel](https://www.npmjs.com/package/babel-plugin-range-operators)!

## Feature Proposals

In order for new features to land in the ECMAScript specification, they must go through several proposal stages, as described [here](https://tc39.github.io/process-document/). The difference between JS and most other ecosystems is that in most ecosystems, language features must exist in the specification *before* they are incorporated into userland code. Not so JavaScript! With babel, you can start using Stage 3 ("Candidate"), Stage 1 ("Proposal"), or even Stage 0 ("Strawman") features in production right away, before they are finalized.

What does it mean for a feature proposal to be at Stage 2 ("Draft")? [According to the TC39](https://tc39.github.io/process-document/), it means the feature implementations are **"experimental,"** and **"incremental" changes** to the feature can be expected. Basically, this means the behavior of the proposed feature *may change* before the feature is finalized.

This is great for those who want to live on the edge, but what about those of us who must prioritize stability over bleeding-edgeness? Can we just stick to finalized features and avoid experimental ones? It is possible, but it's not as simple as you might expect...

## Libraries and Feature-Confusion

The fuzzy boundary between what "is JavaScript" and what are "JavaScript feature proposals" creates a lot of ambiguity and confusion. It's common to mistakenly refer to any "new JavaScript feature" as ES6, ES7, ES.Next or ES2016, more or less interchangeably. Unfortunately, authors of many popular JavaScript libraries do just this, exacerbating the misunderstanding. I'll pick on two lovely library authors here because they are very cool people & I'm sure they know I don't mean it as a personal criticism. ^_^

### Exhibit A: Mobx

I recently found myself looking into new JavaScript libraries and I [encountered](https://mobx.js.org/) some syntax I was not familiar with in JavaScript:

```js
class Todo {
    id = Math.random();
    @observable title = "";
    @observable finished = false;
}
```

`@observable`? Huh! That looks like an [annotation](http://docs.oracle.com/javase/tutorial/java/annotations/basics.html) from Java. I didn't know those existed in the current language specification. It took looking it up to find out that it is in fact *not* JavaScript as currently specified, but a proposed feature. (In fairness, Mobx does explain that this feature is "ES.Next", but that term is vaguely defined and often used to refer to ES6 or ES7 features as well.)

### Exhibit B: Aurelia

From [the website](http://aurelia.io/hub.html#/doc/article/aurelia/framework/latest/what-is-aurelia/1) (*emphasis added*):

> What is it?
>
> Well, it's actually simple. Aurelia is **just JavaScript**. However, it's not yesterday's JavaScript, but the JavaScript of tomorrow.  By using modern tooling we've been able to write Aurelia from the ground up **in ECMAScript 2016**. This means we have native modules, classes, **decorators** and more at our disposal...and you have them too.

Well, now we know: decorators were added to JavaScript in the ES2016 language specification. Just one problem... __*no they weren't!!!*__ Decorators are still a [Stage 2](http://tc39.github.io/proposal-decorators) feature **proposal**. Aurelia is not "just JavaScript," it's "JavaScript *[plus some collection of experimental language features]*"

## So What?

This matters because as anyone involved the JavaScript ecosystem these days knows, "it's hard to keep up with all the latest developments" is probably the #1 complaint about the ecosystem. This causes users to throw their hands up, exasperated, and it causes enterprise organizations to **avoid JavaScript altogether**. Why invest in a platform where it's difficult to even ascertain what the boundaries of the language are?

Also, as mentioned above, **these features are not officially stable**. This means that if you write code depending on the current (proposed) version of the feature, **that code may stop working when the feature is finalized**. While you may consider this an acceptable risk, I assure you there are many users and organizations that do not. Currently, making an informed decision to opt-in to using these experimental features is difficult and requires a high level of expertise&mdash;users must be able to **identify each new feature** & **manually check** where it is in the proposal or release phase. This is especially challenging for organizations for whom JavaScript is not a core-competency.

## Are You Saying No One Should Use Experimental Features?

No! By all means, use them! All I'm saying is that it would be useful to be able to make an **informed choice** to **opt-in** to using experimental features. That way, organizations that prefer stability can say "no thank you" and users who want to be on the bleeding edge can keep bleeding just as they're doing today.

Composer has a mechanism to allow users to [allow or disallow unstable versions of dependencies from being installed](https://getcomposer.org/doc/04-schema.md#minimum-stability) and it *does not* prevent people from using unstable releases, it merely gives them the choice to op-in or out.

An added benefit of increasing visibility into experimental feature use would be to help users understand the TC39 process. Currently there is not enough understanding of what it means for something to be ES6, or ES7, or Proposal Stage 2, as evidenced by the way these terms are thrown around willy-nilly.

In [my next post](/what-is-javascript-part-2-solutions) I'll go over my proposals for addressing this issue.