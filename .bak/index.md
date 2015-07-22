---
layout: page
title: Sequoia's Blog
---
Hello! My name's Sequoia and you can learn a bit about what I do here. If you like what you see, you can find more [twitter](https://twitter.com/_sequoia), [github](https://github.com/sequoia/), or if you are the money-for-work-paying type, [linkedin](http://www.linkedin.com/in/smcdowell). If you find yourself on irc.freenode.net, I'm ```diamonds```, and if you want to write the old fashioned way, I use gmail with the name ```sequoia.mcdowell```. Drop me a line and say hi!

Out of respect for your privacy, I do not use google analytics or other third party scripts that track you on my site.  This means that I have *no idea* that you've visited unless you tell me (site hosted on github).  So if you read an article and liked it, tell me so using one of the methods above!  I plan to get disqus comments up once I figure how to load them asyncronously.
## Blog Posts
<ul class="posts">
  {% for post in site.posts %}
		<li>
		<span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a><br>
		{{ post.content | strip_html | truncatewords: 25 }}
		</li>
  {% endfor %}
</ul>
