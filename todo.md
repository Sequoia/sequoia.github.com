# New Styles

* [X] ~~*font-weight:100 on all header items*~~
  * experiment with just on post pages vs. on all pages
* [X] ~~*header h2{ margin-top: .5rem; }*~~
  * [X] ~~*Be sure to fix menu after*~~
* [X] ~~*h2 : remove uppercase*~~


# Random stuff

## New pages
* [X] ~~*hire me*~~
* [ ] augment projects page?
* [ ] "portfolio" page. What would this look like?

## Styles
* [ ] change colors
* [ ] borders?

## Blog posts to migrate
* [x] avoiding live coding
* [x] strongloop deep dive

# RX.js update

## What functions do we need?
* [ ] build a post
* [ ] build a page
* [ ] read markdown files from FS
* [ ] build index page (from posts)
  * requires summaries of posts
    * use `parsedPosts.combineLatest` to get always-updated copy of posts
    * use `distinctUntilChanged` on the `postMetedata` observable to only rebuild index if post metadata changes
* [ ] build an RSS feed (like index page)
* [ ] Write a post to html
  * [ ] create output directory <-- happens first
  * use `do` for this ?
  * [ ] write file to disk

### Stretch/extra
* [ ] watch posts, build a single post file
  * [ ] 
* [ ] watch includes, layouts, etc.: rebuild all