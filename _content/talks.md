---
title:
slug: talks-and-trainings
---

# Talks

Talks listed in reverse chronological order.

## Debugging Node.js

This talk goes over Node.js debugging techniques from the simple such as using the Debug module and named functions to more complex including interactive debugging running applications, capturing and analyzing CPU profiles, capturing and comparing heap dumps, and more.

* Great Indian Developer Summit 2017, Bangalore, India
* [Video](https://www.youtube.com/watch?v=ntJ7lPiTU_E "I'd never flown to India before. Can you tell how jet lagged I was? 🛬🙃")
* [Slides](https://sequoia.makes.software/debugging-nodejs-talk)

## Node.js: Flow Control with Streams & Promises

This talk covers asynchronous flow control mechanisms in Node.js, Streams, Event Emitters, and Promises in particular. I created this talk for Nodeschool International Day 2015 to suplement the Nodeschool training materials.

* Nodeschool International Day 2015, 2016, Holyoke, Massachusetts, USA
* [Slides](https://docs.google.com/presentation/d/1QoAOomGy874ULTIBxkoIBf_N47TeTpotsGVTB3YeQzk/edit?usp=sharing)

## Building Shell Tools with JavaScript

Talk title is fairly self-explanatory. I walk through building a configurable web-scraping CLI with Node.js, starting with a simple script and improving the UI & adding features (and `man` pages!) along the way.

* EmpireJS 2015, NYC, USA
* [Video](https://www.youtube.com/watch?v=LJgbx8yIBL8)
* [Unedited Video](https://www.youtube.com/watch?v=SEbVW0mQe2A) where you get to see me improvise when the machine running the slides (not my machine) freezes, twice 😅
* [Slides](http://bit.ly/shell-tools-slides) (click "Present" and advance with spacebar to see transitions)
* [Demo code](https://github.com/Sequoia/radioechoes-downloader)

## Package Management in PHP

I gave this talk back when [Composer](https://getcomposer.org) and the concept of using an automated dependency manager was still fairly new to many in the PHP world. It's a gentle introduction to the concept an the tool. I used the fantastic [ansi2html.sh](https://github.com/pixelb/scripts/blob/master/scripts/ansi2html.sh) script to capture the command line interactions, and used [Reveal.js "fragments"](https://github.com/hakimel/reveal.js/#fragments) to fade them in bit by bit, faking the command line interactions in the slides.

* NorthEast PHP 2013, Boston, USA
* [Slides](http://sequoia.makes.software/composer-talk/) (advance with spacebar)
* [Video](https://www.youtube.com/watch?v=Lm7K6AbV8SQ)

## Testing JavaScript with Jasmine

This was my first conference talk! It's a very rudimentary introduction to unit testing for JavaScript developers. Like the Composer talk above, this talk was introducing a common practice (in this case unit testing) where it was not yet a common practice.

* Valley Summit 2012, Northampton, Massachusetts, USA
* [Slides](http://sequoia.makes.software/jasmine-talk/)
* [Demo code](https://github.com/Sequoia/BetterMath) (look through branches for different steps)

# Trainings

Also listed in reverse chronological order.

## Getting Started with Encrypted Communications

I created this ongoing series of trainings to introduce complete beginners to encrypted communication tools and practices. The hands-on workshop was designed with beginner-friendliness as an explicit top priority, and as such it covers only the most necessary concepts and recommends specific tools rather than offering lists of options.

The workshop has evolved over the years. In 2014 it was focused on [OTR](https://otr.cypherpunks.ca) chat using tools like [Pidgin](https://pidgin.im/). As the major desktop chat providers (primarily google and facebook) shut down their XMPP services and as people moved to mobile, OTR & Pidgin became less relevant. By 2018 the workshop focused primarily on using the [Signal](https://signal.org) chat application, due primarily to its ease of use.

PGP/[GPG](https://gnupg.org) was also covered upon request, but not recommended as a "getting started" tool due to the more complicated nature of setting it up and using it properly.

Starting in 2016 I printed [stickers that said "Crypto Educator"](/img/crypto-educator-badge.png) to give to attendees as a reward for getting at least one friend set up with the tools they had just learned to use. This served several purposes:

1. Ensuring attendees had at least one person to chat with using the new tool
2. Empowering attendees, giving them "permission" to teach the skills they just learned
3. Creating evangelists: when someone sees the sticker on the attendee's phone or laptop, they'll ask "what's that?" and the attendee/educator will have the opportunity to get another person onto encrypted tools!


* Hackers On Planet Earth 2014, 2016, 2018, NYC, USA
* NERD Summit, 2016, Amherst, Massachusetts, USA
* [Slides](https://docs.google.com/presentation/d/1d6YDaeRNP3l1NYJVXejoXhJfE1lL2o7uCYx_njMB8LM/edit?usp=sharing)
* [Handout](https://bit.ly/crypto-intro)

## Intro to Node.js: 2-day Intensive

[This training](https://conferences.oreilly.com/fluent/fl-ca-2016/public/schedule/detail/47786) was commissioned by O'Reilly in 2016 for their flagship web conference, FluentConf. From the abstract:

> Topics covered include:
> 
> * JavaScript review: scope, callbacks, and other key concepts
> * When to use Node: replatforming vs. complementing your current stack
> * Core libraries: reading files, parsing URLs, resolving paths—the Noder’s toolbox
> * Understanding async: one weird trick for handling high throughput on a single thread
> * NPM and the Node ecosystem: finding, consuming, and creating Node modules + NPM tricks
> * Databases and ORMs: using Mongo and MySQL in Node.js
> * Building a web server: using Express.js, the most popular web framework in Node.js

This training covers a lot!

* FluentConf 2016, San Francisco, USA
* [Slides](https://sequoia.makes.software/node-training/)
* [Code examples](https://github.com/sequoia/code-along)


##  Practical Microservices: Exploring design patterns, platforms, and tools with Docker and Kubernetes

Wow, that's a long title! This training was also commissioned by O'Reilly for FluentConf & Velocity. It covered a very wide variety of platforms and topics in the "whirlwind tour" format. We started with a monolith application then worked on decomposing it to microservices in various patterns, including Function-As-A-Service, Platform-As-A-Service (Now.sh), and containerization with Docker & Kubernetes. We also surveyed providers, deploying our stack across a variety of environments including Now.sh, IBM Bluemix, AWS Lambda, & Google Cloud Engine.

This was a challenging training to design, owing to the facts that "Microservices" is an extremely broad topic and that it means something different to everyone.

* FluentConf/Velocity 2017, San Jose, California, USA
* [Slides](http://sequoia.makes.software/microservice-slides/)
* [Code Examples](https://github.com/Sequoia/microservices-code-along/tree/00-Instructions) (see the readme for instructions)

## Nodeschool International Day

As a core organizer of the [Nodeschool](https://nodeschool.io) organization, I was involved in plannig and organizing the first Nodeschool International Day, both at the international level and in my own community. The purpose of the event was to evangelize Node.js and offer free trainings to developers using the Nodeschool training content.

For the International Day events, I created a couple presentations, one introducing Node.js generally and one explaining Node.js streams as well as other asynchronous flow control mechanisms in Node.js.

* [Slides: Nodeschool International Day Intro](https://docs.google.com/presentation/d/1gglPKTFksL71B5hsh6-LtQp9lE4qBGedOfnzZMjxaV0/edit?usp=sharing)
* [Slides: Streams and Promises](https://docs.google.com/presentation/d/1QoAOomGy874ULTIBxkoIBf_N47TeTpotsGVTB3YeQzk/edit#slide=id.g112c9d0768_0_0)