---
title: "When to use a Programming Framework"
date: August 1, 2018
description: >
    Frameworks are good when they speed up stuff you already know how to do; if they are just magic incantations and you have no idea what they’re actually doing, that’s when you run into trouble.
hidden: true
---

Against my own best judgement, I recently read a clickbait article with title like "Why You Shouldn't Use Web Frameworks." While I do hold a general wariness of web application frameworks, I disagree that frameworks are bad in all cases. In fact, in many cases you'd be downright crazy _not_ to use a framework.

> And what cases are those, pray tell?

Read on and find out!

## When to Use a Framework

In short, it makes sense to use a framework for:

1. Expediency: You _could_ solve the problem the framework addresses, but someone has already come up with a good solution, and/or
2. Extending your reach: The framework helps you do something outside your core skills, which you have no interest in learning how to do

### Expediency

One example of the first case was revealed to me by a friend, who was building a website for a client with Drupal. He wanted to implement search with [Solr](https://lucene.apache.org/solr/), and there was a Drupal plugin to do it, so he used that plugin. He was a skilled developer and could have written a CMS from scratch and implemented Solr search to boot, but this would have been a waste of time because _someone had already done it_. He wasn't using a framework out of ignorance or inability to complete the task without one, but out of expediency.

Likewise, writing base HTTP routing logic, query string parsing, and HTTP body parsing is not a herculean task, but if someone has done it already, why reinvent the wheel? A key component to this rationale, however, is that you _could_ do the task by hand if you wished. We'll discuss why this is important later... 

### Extending Your Reach

The second case relates to when you don't know how to solve a problem a framework offers a solution for and you don't care to learn. If you're a python developer and you want a nicely layed out website that works well on mobile phones and looks professional, you can get there with [Bootstrap](https://getbootstrap.com/) without learning hardly any of the underlying browser technologies (HTML, CSS, etc.). A framework is a very powerful tool in this case, **extending** your ability to create things far beyond your realm of expertise.

> But you **should** learn the underlying technologies!!
> 
> \- Strawman Who Hates Frameworks

If writing browser based user interfaces is a core skill of yours (or you wish it to be), **yes**, you should learn the underlying technologies. But if it's not a core skill and you don't wish it to be, learning, for example, how [flexbox](https://internetingishard.com/html-and-css/flexbox/) works, is a **waste of your time**. Time is finite: you will not become an expert in everything. It is best to focus your time on those things you _do_ wish to be an expert in, and use out-of-the-box solutions for the rest.

## When Not to Use a Framework

TODO The first reason not to use a framework is TODO

1. When you're learning: When you are just starting on your journey to becoming a professional programmer
2. Because it's all you know: Not everything is a nail, you should have more tools than just a hammer
3. When it's overkill: When the framework has ten features and you only need one
4. When it makes absolutely no sense: More common than you'd think!



I actually agree with some of the points but obviously overall it’s overstated

Leo [22 minutes ago]
Can you clarify the points you disagree with the blog post?

Sequoia [22 minutes ago]
It’s overstated & oversimplified

Sequoia [21 minutes ago]
in fact, using a framework can be a fantastic approach, especially if you do not plan to specialize in that area of work

Sequoia [20 minutes ago]
for example if I’m making a website for a business idea or something, using Rails & Bootstrap can get me up and running with layouts, login/auth, routing, admin screens, callout boxes, modals, etc. etc. etc. in <1 day

Leo [20 minutes ago]
This David is really angry about frameworks joy

Sequoia [5 minutes ago]
if I’m a backend dev and I want a UI, bootstrap is great

Leo [5 minutes ago]
that’s for sure

Sequoia [5 minutes ago]
if I want to become a professional front-end engineer and designer, bootstrap is not a good tool to start out with!

Sequoia [4 minutes ago]
I think that’s the point the author is struggling to make

Leo [4 minutes ago]
however I do agree with this point: You will suffer from eternal imposter syndrome because you don't know how anything works.

Leo [4 minutes ago]
If all you know is to run scaffolding frameworks commands, you never gonna feel that you know what’s going on

Sequoia [1 minute ago]
here’s how I put it: Frameworks are good for:
1. Stuff you don’t care to learn, ever i.e. you’re a backend dev and you really don’t care about HTML/CSS so you use bootstrap
2. Stuff you have the skills to do on your own but don’t want to do everything from scratch. For example, using a SOLR search plugin for drupal if you’re a Sr. dev: you could do this by hand but why?

Sequoia [1 minute ago]
frameworks are good when they speed up stuff you already know how to do; if they are just magic incantations and you have no idea what they’re actually doing, that’s when you run into trouble