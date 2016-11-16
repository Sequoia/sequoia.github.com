# Random stuff

## New pages
* [ ] hire me
* [ ] augment projects page?

## Styles
* [ ] change colors
* [ ] borders?

## Blog posts to migrate
* [ ] avoiding live coding
* [ ] strongloop deep dive

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