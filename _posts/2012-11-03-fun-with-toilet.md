---
layout: post
title: "Fun With Toilet"
description: ""
category: 
tags: []
---
{% include JB/setup %}

Shell feeling shabby? Let Toilet spice it up! [Toilet](http://caca.zoy.org/wiki/toilet) is a shell utility from [caca labs](http://caca.zoy.org/) that outputs text in large block type.  It is modeled after [figlet](http://www.figlet.org/), adding color and Unicode support.

I installed toilet on my (Ubuntu) system using the following command.  Use your package manager or get [the source](http://caca.zoy.org/wiki/toilet).
{% highlight bash %}
$ sudo apt-get install toilet toilet-fonts
{% endhighlight %}

Toilet comes with a number of fonts by default, installed to ```/usr/share/figlet``` on my system.  The following command, run from the directory containing the fonts, will create a file that contains the name of each available font followed by an example.  Note that while the name of the font file with the extension is used in the following command, the extension is not necessary.
{% highlight bash %}
$ for font in *; do echo $font >> ~/tmp.txt && toilet Hello -f $font >> ~/tmp.txt; done;
{% endhighlight %}
{% highlight text %}
$ head ~/tmp.txt
ascii12.tlf

 mm    mm            mmmm      mmmm
 ##    ##            ""##      ""##
 ##    ##   m####m     ##        ##       m####m
 ########  ##mmmm##    ##        ##      ##"  "##
 ##    ##  ##""""""    ##        ##      ##    ##
 ##    ##  "##mmmm#    ##mmm     ##mmm   "##mm##"
 ""    ""    """""      """"      """"     """"
{% endhighlight %}

Toilet also comes with options to further transform or decorate your text, called "filters."  The following command will will output the name of each filter followed by an example, as above.  This command outputs to the terminal rather than a file because the filters that add color may not come thru in the saved file
{% highlight bash %}
for filt in $(toilet -F list | sed -n 's/\"\(.*\)\".*/\1/p'); \
do echo $filt; toilet -f mono12 $(echo $USER) -F $filt; done;
{% endhighlight %}

I like border, flip, and left, but the best filter is of course "gay".
![the word "diamonds" in block text with the "gay" filter applied](/img/gay_filter.png)
Mix and match fonts and filters to come up with a combination you like.  Note that the filter switch can take a colon separated list of filters e.g. ```toilet "58008" -F gay:180 -f smblock```.

Excepting the "metal" and "gay" filters, Toilet does not add colors to your text.  This is [as it should be](http://en.wikipedia.org/wiki/Unix_philosophy#McIlroy:_A_Quarter_Century_of_Unix) as there are already utilities to add color to text in the terminal.  I know what you're thinking: "but those terminal escape sequences are a nightmare!" and I was thinking the same thing 'til the fine folks of [#bash](http://irc.lc/freenode/bash/diamonds_sent_me) set me straight.  To wit, there is a tool built into bash called ```tput``` which handles color more gracefully than escape sequences (sorry zsh, csh, ash, tcsh, posh, pish, cash, ish, & knish users).  I encourage you to check out the [examples](http://bash.cumulonim.biz/BashFAQ%282f%29037.html) of using ```tput``` to color terminal text.  If you just want to get started, use ```tput setaf x``` and ```tput setab x``` to color your foreground and background, respectively, substituting x with a number 0-9 for different colors.  See ```man tput``` and ```man terminfo``` ("Color Handling" section) for more.
![examples of using tput with toilet](/img/tput_toilet.png)

So as for what you can actually *do* with toilet... that will be an excercise left to the reader.  A friendly greeting in bashrc or a big red warning message are two uses that spring to mind.  Drop me a line and let me know how you use it.  Have fun!
