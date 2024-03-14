---
title: Slicing and Dicing Slido Questions with JQ
date: November 4 2021
description: >
    More examples of using jq to parse json in the shell, this time using Slido for examples.
---

TODO: add an intro about having fun during boring all hands meetings.

In Slido, the web UI shows you something like this:

![Slido question in the Slido UI](/img/slido-question.png)

But this isn't the whole story when it comes to this question! The API actually makes many more fields available. This is the JSON for the question above:

```json
{
  "author": {
    "attrs": {},
    "event_user_id": 171109668,
    "name": "Zack Venema"
  },
  "attrs": {
    "language": "en",
    "sentiment": "Neutral",
    "author_name": "Zack Venema",
    "is_profane": false,
    "profanity_metadata": [],
    "is_comment": false
  },
  "type": "Question",
  "text_formatted": "Recent cyberattacks have been targeting US infrastructure. How are we protecting our business from potential attacks?",
  "event_question_id": 37141320,
  "event_id": 4386965,
  "event_section_id": 4975232,
  "event_user_id": 171109668,
  "text": "Recent cyberattacks have been targeting US infrastructure. How are we protecting our business from potential attacks?",
  "is_public": true,
  "is_answered": false,
  "is_highlighted": false,
  "is_anonymous": false,
  "is_bookmarked": false,
  "score": 110,
  "score_positive": 176,
  "score_negative": -66,
  "date_published": null,
  "date_highlighted": null,
  "path": "/questions",
  "date_created": "2021-06-09T22:18:54.000Z",
  "date_updated": "2021-06-09T22:18:54.000Z",
  "date_deleted": null,
  "labels": [],
  "pinned_replies": []
}
```

Upvote count, downvote count, sentiment... very interesting! The Slido API returns an array of objects like this to the browser–shall we scrape this data out and use [`jq`](https://stedolan.github.io/jq/) to examine it? Let's shall!

## Getting the data

I'm not sure if Slido offers a programatic third party API for this data, but we don't care! We're piggybacking off the web application, which is already permitted to fetch this data. There are two ways to get the data we want to process in the terminal with `jq`:

1.  In the browser console "network" tab, **copy the response**
2.  In the browser console "network" tab, **copy the request "as curl"** and re-submit the request in your terminal

The first approach is simplest, the second is required if you want to get the freshest data or to watch changes over time (e.g. by running a command with [`watch`](https://linux.die.net/man/1/watch)).

For either approach, you'll follow these steps first

1.   Navigate to the Slido page for the event in question (I use the Chrome browser here)
1.   Open the developer console
1.   Click the "network" tab
1.   Refresh the page
1.   Scroll down 'til you can't scroll no more (it loads more questions "infinite scroll" style)

Then pick one of these two approaches to get the data:

### Copying the response data

Right click on the request to `/questions` (ideally the one with `sort=top` and `limit=50`) then click Copy > Response

![copying the question json data from the Firefox devtools network pane](/img/slido-copy-response.png)

You can now paste these into a file, such as ~/questions.json for example (that's the approach I use below).

### Copy request ("Copy as cURL") and run the request in your terminal

Right click the request and click "Copy > Copy as cURL"

![copying the question request "as curl" from the Firefox devtools network pane](/img/slido-copy-curl.png)

Then you can run the request in your terminal and pipe the output to jq:

```nohilight
❯ curl 'https://app.sli.do/api/v0.5/events/4763ff50-520f-4753-a165-c7db45ee52b5/questions?path=%2Fquestions&eventSectionId=3195394&sort=newest&highlighted_first=true&limit=50' \
  -H 'authority: app.sli.do' \
  -H ... additional headers omitted...
  --compressed | jq
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2893    0  2893    0     0  16072      0 --:--:-- --:--:-- --:--:-- 16072
[
  {
    "author": {},
    "attrs": {
      "language": "pt"
    },
    "type": "Question",
    "text_formatted": "Como lidar com o medo de engravidar, medo de ter outro filho com o destino especial. ",
    "event_question_id": 26473370,
    "event_id": 2815079,
    "event_section_id": 3195394,
    "text": "Como lidar com o medo de engravidar, medo de ter outro filho com o destino especial. ",
    "is_public": true,
    "is_answered": false,
    "is_highlighted": false,
    "is_anonymous": true,
    "is_bookmarked": false,
    "score": 0,
    "score_positive": 0,
    "score_negative": 0,
    "date_published": null,
    "date_highlighted": null,
    "path": "/questions",
    "date_created": "2020-10-31T18:10:17.000Z",
    "date_updated": "2020-10-31T18:10:17.000Z",
    "date_deleted": null,
    "labels": [],
    "pinned_replies": []
  },
 
...
```

Using curl has the advantage of fresh data but the **disadvantage** of disappearing questions! Questions that you saw on the web view may be deleted or closed by the time you run curl again.

🎶 Now that we've got ~~love~~ data 🎶  what are we gonna do... 🎶  with it? 🎶 

## Stuff You Can Do With The Data With jq :

<aside class="info">

<p>*NB: For the following examples, I used the "copy response" method described above & pasted the results into a file using the following Mac OSX command:*</p>

<pre>
<code class="hljs lang-nohilight">❯ pbpaste > ~/questions.json </code>
</pre>

</aside>

### Votes Summary

I like using versions of this to see how many up & down votes each question has. Here I also:

    Use the -r  (raw) switch to strip the quotes of the resulting string
    Limit to the first 5 results with head 

❯ cat ~/questions.json \
| jq -e '.[] | "\(.score) (\(.score_positive),\(.score_negative)) \(.text)"' -r | head -n 5
187 (+221,-34) DiDi SEC filling reports $565M non-GAAP EBITA on Q121 only on their China Mobility business, this is almost twice our Global Mobility EBITDA on Q121, thoughts?
186 (+222,-36) Rides is double digit $ > Lyft (sometimes $30+) on many routes in NYC. We just lost a big corporate account to Lyft bc of this. Why would riders stay with Uber?
154 (+209,-55) DoorDash is launching in Japan; what steps can we take to remain on top after they surpassed us in the US?
110 (+176,-66) Recent cyberattacks have been targeting US infrastructure. How are we protecting our business from potential attacks?
97 (+129,-32) What is the status of Eats for Business?  If there is a strong value prop, why are we not using it in our own offices?

Building strings in JQ

.text_field + " literal string " + (.number_field|tostring) 👈 The general form building your own output string from fields. NB: numeric fields must be piped (in parens!) to tostring  before they can be "added" to string values. 
Update: A better way to build output strings

"\(.text_field) literal string \(.number_field)" 👈 The general form of building your own strings using string interpolation. (Thanks Johan Jensenfor pointing this out!)
Finding questions containing a pattern or string

How many questions mention Doordash? There's a few ways to find this out. If you just want the text, it's simplest to extract the .text  string then select based on a regular expression:

select(test("your pattern", "i"))  👈  how to filter strings based on case insensitive regex. Example:
❯ cat ~/questions.json \
| jq -e '.[].text | select(test("DoorDash"; "i"))'
"DoorDash is launching in Japan; what steps can we take to remain on top after they surpassed us in the US?"
"DoorDash has same day background check for drivers. On our app- it takes 3-5 business days for our delivery drivers. How are we working towards expediting this?"

If you want other fields as well, you need to pass the whole object through and extract the .text  field in your select  expression:
❯ cat ~/questions.json \
| jq -e '.[] | select(.text | test("DoorDash"; "i")) | "\(.score): \(.text)"'
"154: DoorDash is launching in Japan; what steps can we take to remain on top after they surpassed us in the US?"
"97: DoorDash has same day background check for drivers. On our app- it takes 3-5 business days for our delivery drivers. How are we working towards expediting this?"

Finally, if you prefer to do things The Unix Way 
, you can extract the text and pipe it to another tool. In this case I'm extracting .text  then using ack to do my filtering.
❯ cat ~/questions.json \
| jq -e '.[].text' \
| ack -i "(Doordash|\bDD\b)"
"DoorDash has same day background check for drivers. On our app- it takes 3-5 business days for our delivery drivers. How are we working towards expediting this?"
"DoorDash is launching in Japan; what steps can we take to remain on top after they surpassed us in the US?"

This approach is of course useful if you want to compose your command with other unix programs such as sort, uniq, wc  etc.
Top 10 most downvoted questions

sort_by can take a field name and sort by its value.
❯ cat ~/questions.json \
| jq -e 'sort_by(.score_negative) | .[] | "\(.score_negative) \(.text)"' -r | head -n 10
-134 Nelson, how do we make Uber a meme stock?
-97 Global All Hands often feels and looks like US All Hands. How can we keep 'living locally' in that aspect?
-87 All signs point to an even worse fire season in the U.S. this year. Does this change the thinking on return to work in September?
-75 Bo, only 0.4% of F500 board director roles are held by LGBTQ+ (vs. 7% of population). In the spirit of Pride, have we considered diversity targets for LGBTQ+?
-66 Recent cyberattacks have been targeting US infrastructure. How are we protecting our business from potential attacks?
-62 As thousands of us return to open office plans in the US, can we make it company policy to require employees to submit their covid-19 vaccination status to HR?
-55 DoorDash is launching in Japan; what steps can we take to remain on top after they surpassed us in the US?
-53 Will UberPool be back any time soon?
-50 What is business risk of having David Weil run the U.S. Labor Department division overseeing gig worker rights? What would we do differently if he is nominated?
-50 What's the best way Uber employees can help get our favorite restaurants on Eats? My restaurant-owner friend won't sign up b/c he believes it's too expensive.
Count by sentiment

reduce semantics in jq  are a bit confusing and the docs don't help much.

The following examples says:

    Iterate over "each item": .[] 
    as $question 
    Initialize our accumulator to an object: {} 
    With our accumulator object: . 
        Increment: +=1 ...
        ...the value at the key corresponding to this question's sentiment: [$question.attrs.sentiment] 
    Return the accumulator (implicit)

❯ cat ~/questions.json \
| jq 'reduce .[] as $question ({}; .[$question.attrs.sentiment] += 1)'
{
  "Neutral": 31,
  "Negative": 4,
  "Positive": 2
}
Text of questions with "Negative" sentiment

My curiosity is peeked! Let's pique at those "negative" questions:
❯ cat ~/questions.json \
| jq '.[] | select(.attrs.sentiment=="Negative")| .text'
"What is the status of Eats for Business?  If there is a strong value prop, why are we not using it in our own offices? "
"What's the best way Uber employees can help get our favorite restaurants on Eats? My restaurant-owner friend won't sign up b/c he believes it's too expensive."
"Can we please have a clear and unequivocal condemnation of antisemitism?"
"All signs point to an even worse fire season in the U.S. this year. Does this change the thinking on return to work in September?"
Conclusion

That's our whirlwind tour of using jq  to squeeze a bit more context out of the data Slido makes available! If you have other fun ways to "slice and dice" this info (find questions with profanity perhaps?) sound off in the comments!