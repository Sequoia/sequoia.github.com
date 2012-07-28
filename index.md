---
layout: page
title: Sequoia's Blog
---
Hello! My name's Sequoia and you can learn a bit about what I do here. If you like what you see, you can find more [twitter](https://twitter.com/_sequoia), [github](https://github.com/sequoia/), or if you are the money-for-work-paying type, [linkedin](http://www.linkedin.com/in/smcdowell).
## Blog Posts
<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>
