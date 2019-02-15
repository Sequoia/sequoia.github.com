---
title: "When to Use a Programming Framework"
date: February 15, 2019
description: >
    Frameworks are good when they speed up stuff you already know how to do; if they are just magic incantations and you have no idea what they’re actually doing, that’s when you run into trouble.
---

Against my own best judgement, I recently read a clickbait article with title like "Why You Shouldn't Use Web Frameworks." While I do hold a general wariness of web application frameworks, I disagree that frameworks are bad in all cases. In fact, in many cases you'd be downright crazy _not_ to use a framework.

> And what cases are those, pray tell?

Read on and find out!

## When to Use a Framework

In short, it makes sense to use a framework for:

0. Prototyping: Getting an idea to a usable piece of software very quickly
1. Expediency: You _could_ solve the problem the framework addresses, but someone has already come up with a good solution, and/or
2. Extending your reach: The framework helps you do something outside your core skills, which you have no interest in learning how to do

### Prototyping

If you're making a website for a business idea, using Rails & Bootstrap can get you up and running with layouts, login/auth, routing, admin screens, callout boxes, modals, etc. in less than a day, provided you're familiar with the tools. This is pretty amazing!

### Expediency

A friend was building a site with Drupal and he wanted to implement search with [Solr](https://lucene.apache.org/solr/). There was a Drupal plugin to do it, so he used that plugin. He was a skilled developer and could have written a CMS from scratch and implemented Solr search to boot, but this would have been a waste of time because **someone had already done it**. He wasn't using a framework out of ignorance or inability to complete the task without one, but out of expediency.

Likewise, writing basic HTTP routing logic and query string parsing is not a herculean task, but if someone has done it already, why reinvent the wheel? A key component to this rationale, however, is that you _could_ do the task by hand if you wanted to. We'll discuss why this is important later... 

### Extending Your Reach

Sometimes...

1. you you don't know how to solve a problem from scratch
2. **you have no interest in learning how to do so**, and
3. a framework offers a ready made solution

This is a great time to use a framework!

If you're a python developer and you want a nicely layed out website that works well on mobile phones and looks professional, you can get there with [Bootstrap](https://getbootstrap.com/) without spending time learning a lot of HTML, CSS, and other browser technologies. A framework is a very powerful tool in this case, **extending** your ability to create things far beyond your realm of expertise.

> But you **should** learn the underlying technologies!!
> 
> \- Strawman Who Hates Frameworks

If writing HTML based user interfaces is a **core skill** of yours (or you wish it to be), **yes**, you should learn the underlying technologies. But if it's not a core skill and you don't wish it to be, then learning how [flexbox](https://internetingishard.com/html-and-css/flexbox/) works is a **waste of your time**. It is best to focus your time on those things you _do_ wish to be an expert in, and use out-of-the-box solutions for the rest.

## When Not to Use a Framework

There are at least four situations where it's _not_ appropriate to use a framework:

1. When you're learning: When you are just starting on your journey to becoming a professional programmer
2. Because it's all you know: Not everything is a nail, you should have more tools than just a hammer
3. When it's overkill: When the framework has ten features and you only need one
4. When it makes absolutely no sense: More common than you'd think!

### Learning

This is the counterpoint to the "use a framework if you don't care to learn the underlying technologies" argument. If you _do_ want to learn and develop expertise in the underlying technologies, a framework is not a good way to start, in my opinion.

For example, if you are just getting started with web programming, and want to become a professional JavaScript programmer, **do not start out by using Angular or React/Redux/Webpack!!** These tools assume a high degree of familiarity with JavaScript. They are built for professionals to speed development and scaling of complex applications. **They are not built to help beginners learn JavaScript & HTML.**

Starting your learning journey with a big framework has many disadvantages:

1. It's likely to be overwhelming and confusing
2. You're dependant on the framework, and if you need to augment or extend its behavior you won't know how
3. You'll need to rely on "experts" to help you when you get stuck, because you'll lack the skills needed to actually understand the framework internals once it becomes necessary to do so
4. It doesn't teach you the fundamentals of the language or environment, so you'll be stuck using that framework until you bite the bullet and actually learn the underlying tools
5. You won't know *why* the framework does what it does–this understanding only comes from working without a framework

Instead of starting with a framework, just start with HTML, JavaScript, and a tab pinned to <https://devdocs.io/>. Try stuff out! Read the docs! Don't be afraid to write "bad" code–doing so is essential to learning.

When certain tasks become tedious, you'll know it's time to pull in a library. Eventually you'll get to a point where you say "gee, I wish there were an easier way to do X", for example, create HTTP requests. At that point you pull in [a library to do that task](https://github.com/axios/axios). Whereas a framework gives you a full toolbox and a set of instructions, writing by hand and pulling in libraries as needed **will help you understand why it is useful to use that tool.**, which is a crucial to programming effectively, with or without a framework!

### It's All You Know

If all you know is React/Webpack, you will struggle to solve problems that React was not designed to solve. Ideally, you should analyze a business problem first, then decide what the best tool is to solve that problem. If all you have is one tool, you are not capable of doing this.

Having only one tool that you know frequently leads to the next two framework-use-antipatterns...

### Overkill

Imagine you have a bunch of <acronym title="Internet of Things">IoT</acronym> thermometers, and they need a server to periodically send data to, which will write that data to a <acronym title="Comma Separated Values">CSV</acronym> file. This server needs exactly 1 endpoint: `record_temperature`.

If all you know is Ruby on Rails, you will probably create a new Rails app with a database, a complex & powerful <acronym title="Object Relational Mapper">ORM</acronym>, models, controllers, flexible authentication options, admin routes, json marshalling, HTML templating, and dozens of other features. This is overkill! Furthermore, the tool isn't even built to do what you need it to do (Rails is designed to work on a database, not a single CSV file). If you learned "Ruby" to start, rather than "Ruby on Rails", you would be able to easily build a tiny server, probably with one single file and zero dependencies, and this is guaranteed to be cheaper to run and easier to maintain.

### When It Makes No Sense

Once, for a coding test, my employer asked engineering job candidates to build a sample application that took text as input (from the command line), did some processing, and output some other text. The candidate could choose whatever language they were most comfortable with. A typical solution might contain two or three source files of Java, Python, or JavaScript (Node.js).

I was reviewing one candidate's submission, and found a half dozen directories, config files for eslint, vscode and webpack, several web-font files, an image optimization pipeline, all of React.js and far more.

![It Doesn't Make Sense](/img/doesnt-make-sense.png)

The candidate had clearly learned to use `create-react-app` to start projects, and had learned no other way. That lead them to submit a solution one hundredfold more complex than was needed, and that didn't meet the requirements–we didn't ask ask for a web app! This is an extreme case but it illustrates the fact that if you only know one tool, you will invariably attempt to use it to solve problems it's not well suited for.

## Conclusion

Programming frameworks can be useful tools, but they can only be deployed appropriately if you've learned enough to be able to pick the right tool for the job. To learn this skill, you must first learn to work _without_ frameworks.

Put another way, the best way to ensure you use frameworks properly (as a beginner) is to not use them at all. Does that make sense?