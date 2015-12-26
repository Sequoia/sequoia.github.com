---
title: "LoLshield Sequencer"
layout: post.hbs
collection: posts
date: 2012-07-19
---
The goal of this project was to create a tool to make it easier to create "animations" on the [LoL Shield](http://jimmieprodgers.com/kits/lolshield/makelolshield/), an [Arduino](http://arduino.cc/) shield with a bunch of LEDs.  [The existing tool](https://docs.google.com/spreadsheet/ccc?key=0Aj5ldW_o2jR3dEJXMnI2Q1V4dkNQa0x5U0J2QVdyWHc&hl=en#gid=0) that was offered to assist in mapping out the shield states was a Google spreadsheet which I could never figure out how to use.  I wanted a tool that:
* was point & click (& generally easy to use)
* made it easy to visualize how a state would look on the actual board
* helped one understand the way the board states are encoded (more on this below)
* allowed one to sequence out and play thru an entire animation
* allowed nontechnical, hardware curious users control the blinkenlights right away, for immediate gratification (came up with this later)
The impetus for the project was as follows: I wanted to do an Arduino project and thought it'd be cool to have an LED sign that said "diamonds" and did little diamonds animations so I could hang it around my neck on a chain like some post-modern jewelery. I ordered a LoL Shield and while I was waiting for it to come I took a look at [the code](https://github.com/5263/LoLShield/blob/master/examples/LoLShield_BasicTest/LoLShield_BasicTest.pde#L51) and found this:

```c
//Horizontal swipe
{1, 1, 1, 1, 1, 1, 1, 1, 1} ,
{3, 3, 3, 3, 3, 3, 3, 3, 3},
{7, 7, 7, 7, 7, 7, 7, 7, 7},
{15, 15, 15, 15, 15, 15, 15, 15, 15},
{31, 31, 31, 31, 31, 31, 31, 31, 31},
{63, 63, 63, 63, 63, 63, 63, 63, 63},
{127, 127, 127, 127, 127, 127, 127, 127, 127},
{255, 255, 255, 255, 255, 255, 255, 255, 255},
{511, 511, 511, 511, 511, 511, 511, 511, 511},
{1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023},
{2047, 2047, 2047, 2047, 2047, 2047, 2047, 2047, 2047},
{4095, 4095, 4095, 4095, 4095, 4095, 4095, 4095, 4095},
{8191, 8191, 8191, 8191, 8191, 8191, 8191, 8191, 8191},
{16383, 16383, 16383, 16383, 16383, 16383, 16383, 16383, 16383},
{16382, 16382, 16382, 16382, 16382, 16382, 16382, 16382, 16382},
{16380, 16380, 16380, 16380, 16380, 16380, 16380, 16380, 16380},
{16376, 16376, 16376, 16376, 16376, 16376, 16376, 16376, 16376},
{16368, 16368, 16368, 16368, 16368, 16368, 16368, 16368, 16368},
{16352, 16352, 16352, 16352, 16352, 16352, 16352, 16352, 16352},
{16320, 16320, 16320, 16320, 16320, 16320, 16320, 16320, 16320},
{16256, 16256, 16256, 16256, 16256, 16256, 16256, 16256, 16256},
{16128, 16128, 16128, 16128, 16128, 16128, 16128, 16128, 16128},
{15872, 15872, 15872, 15872, 15872, 15872, 15872, 15872, 15872},
{15360, 15360, 15360, 15360, 15360, 15360, 15360, 15360, 15360},
{14336, 14336, 14336, 14336, 14336, 14336, 14336, 14336, 14336},
{12288, 12288, 12288, 12288, 12288, 12288, 12288, 12288, 12288},
{8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192},
{0, 0, 0, 0, 0, 0, 0, 0, 0}, 
{18000}
```

What was all this?! The numbers go up and down and somehow this turns the lights on and off.  I had to learn more.  I looked into it a bit, it turns out its actually not that complicated: there are 9 rows of 14 lights, so each number represents one row, each array of 9 numbers represents one shield state.  Each row of lights on the shield is just a binary number with the least significant bit on the left!  So to turn the first light on, flip the first bit (1), to turn the last light on, flip the 14th bit (8192) etc. (if the dec->bin conversion isn't clear, [read here](http://www.wikihow.com/Convert-from-Decimal-to-Binary)).  Sequencing out these animations manually, row by row, light by light, was obviously impractical, so I set out building a tool to make it easier.  I also wanted an excuse to use bitwise operators, which I never have occasion to use at work. :p

Please take a break now to look at the [LoL Shield Sequencer](http://sequoia.github.com/LSS/), if you haven't already.

Well I didn't get the diamonds animations done ready in time for [HOPE](http://hopenumbernine.net/), but I did get the sequencer working.  I switched tack and decided to make the browser tool drive the physical shield directly, rather than requiring one to cut & paste into the sketch and load it onto the Arduino.  This required transmitting the shield states to the Arduino via the USB port.  I was following [this tutorial](http://arduinobasics.blogspot.com/2011/06/reading-text-or-csv-file-using.html) which told how to read a file with [Processing](http://processing.org/) and transmit the data to the Arduino with the serial library.  So I need to write to the file, which obviously the browser can't do.  My steps are now
1. Send shield state from browser (ajax-wise)
2. Receive the state on server (same box) and write it to a file (I used PHP in the interest of expediency)
3. Read the file with Processing and write the state to the serial port
4. Receive the state on the Arduino and draw it to the shield.

That's a lot of steps!  On a lark, I tried writing some text directly to the USB device (`echo "1" > /dev/ttyUSB0`) and what's this? It worked! It turns out the Linux kernel writes to the USB port at 9600 baud by default (I'm not sure exactly where this default is set but it is set by U-Boot; see `man termios` for info on changing it). So I can cut step 3 and write directly from PHP to the USB port.  The initial PHP script, in its entirety:

```php
<?php
  file_put_contents(/dev/ttyUSB0 , $_POST['frame']);
?>
```

Much simpler!  I let people mess around with it and they did! I was very happy.
![Young man using the LSS in the browser with the Arduino shield updating in real time](/img/lss_hi.jpg)
![A small group of people messing with the LSS](/img/lss_group.jpg)
What heartwarming hacker-con moments!  Later I added a `localStorage` component so people could make little animations & save them, then see what others had done.  I'll have that up and running next con for sure.

## Tools & Technologies I used
* Arduino & soldering iron
* Arduino IDE & C
* underscore, jquery & require.js & Jam.js
* Mousetrap.js (ok not yet but soon!)
* PHP & Linux

## What I learned
* Serial programming is much harder than I expected! It turns out the software can read faster than the hardware can write so if you write your code wrong your reads will actually "overtake" the serial buffer on the Arduino.
* Require.js seems useful but jam.js doesn't really offer much.  The latter doesn't keep an up-to-date version of the former, which makes it much less useful (lost a lot of time figuring out why my shims didn't work)
* Linux writes to serial port at 9600 baud by default
* Learned to solder

## Next steps
* Add a few more functions: shift right, left, up, & down; invert (yay more bitwise math!)
* Abstract the DOM interactions (writing to DOM, listening for events) to its own module so one could conceivably use the LSS module without the browser
* Get Jimmie Rodgers to link to the tool instead of the Google doc!!!
* Tests? ehh... we'll see :)
