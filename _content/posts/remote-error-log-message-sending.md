---
title: "remote error log message sending"
date: March 2, 2017
description: >
    foo
hide: true
---

WIP: notes for remote error log spamming

* started

sequoia [11:51 AM]
hmmm…..

I wonder if you can send devs messages through the error tracking services in browsers :nerd_face:

sequoia [12:17 PM]
lol I have not succeeded at this but I’m learning some about Airbrake’s internals!
`window.xxx.reporters[0]({errors:"what's up soundcloud dev ladies & gents", stack:"check out my mixtape: https://sequoia.makes.software/"}, window.xxx.opts, ({resolve : console.log, reject: console.error}))`
```{code: 400, type: "Bad Request",…}
code : 400
message : "json: cannot unmarshal string into Go struct field JSONNotice.errors of type []models.Error"
type : "Bad Request"```
my problem is I’m having trouble making it throw an actual error to see what a proper request looks like
now I badly want to make this work… :stuck_out_tongue:

_spamming soundclouds airbrake logs continued…_
it appears they do not want  to send stack traces from user entered console errors! filter function:
```function(e, t, n) {
                "use strict";
                function i(e) {
                    var t = e.errors[0];
                    if ("" === t.type && -1 !== r.indexOf(t.message))
                        return null;
                    if (t.backtrace) {
                        var n = t.backtrace[0];
                        if ("<anonymous>" === n.file)
                            return null
                    }
                    return e
                }
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = ["Script error", "Script error.", "InvalidAccessError"];
                t["default"] = i
            }```
```x = new Error('yo');
x.stack = `Error: yo
    at <definitely-not-anonymous.js>:1:2````
:nerd_face:

sequoia [12:57 PM]
 ```function(e, t, n) {
                "use strict";
                function i(e) {
                    var t = e.errors[0];
                    if ("" !== t.type && "Error" !== t.type)
                        return e;
                    var n = t.message.match(r);
                    return null !== n && (t.type = n[1],
                    t.message = n[2]),
                    e
                }
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                var r = new RegExp(["^", "Uncaught\\s", "(.+?)", ":\\s", "(.+)", "$"].join(""));
                t["default"] = i
            }```
`r = /^Uncaught\s(.+?):\s(.+)$/`: gotta be uncaught something
message must also  match this one… `/^\[(\$.+)\]\s([\s\S]+)$/` hmmm…

jgnieuwhof [1:02 PM]
`[$abcd] some msg` ?

Jesse [1:02 PM]
joined #random.

jgnieuwhof [1:02 PM]
@sequoia this is pretty fun to watch lol

sequoia [1:02 PM]
I should get on twitch XD
“[$abc] (foo)“.match(/^\[(\$.+)\]\s([\s\S]+)$/) <-- this works
but it needs to still match the first one “Uncaught”
or maybe this is after that first bit is plucked…

jgnieuwhof [1:04 PM]
yeah, not sure how it could match both `U` and `[` as the first char lol

sequoia [1:05 PM]
`"Uncaught Exception: Hi soundcloud dev people!! Check out my mixtape: https://sequoia.makes.software/".match(/^Uncaught\s(.+?):\s(.+)$/)`

`["Uncaught Exception: Hi soundcloud dev people!! Check out my mixtape: https://sequoia.makes.software/", "Exception", "Hi soundcloud dev people!! Check out my mixtape: https://sequoia.makes.software/", index: 0, input: "Uncaught Exception: Hi soundcloud dev people!! Check out my mixtape: https://sequoia.makes.software/", groups: undefined]`
looks like just part 2 is matched later (the “message” bit after the colon)
```"Uncaught Exception: [$ Hi soundcloud dev people!!] (Check out my mixtape: https://sequoia.makes.software/)".match(/^Uncaught\s(.+?):\s(.+)$/)[2].match(/^\[(\$.+)\]\s([\s\S]+)$/)

==> ["[$ Hi soundcloud dev people!!] (Check out my mixtape: https://sequoia.makes.software/)", "$ Hi soundcloud dev people!!", "(Check out my mixtape: https://sequoia.makes.software/)", index: 0, input: "[$ Hi soundcloud dev people!!] (Check out my mixtape: https://sequoia.makes.software/)", groups: undefined]```
nice B)
 ```return n(55).get("rollouts").get("v2_airbrake") && !n(55).get("versionOutOfDate") && e.errors.some(function(e) {
                var t = e.backtrace;
                return t.some(function(e) {
                    var t = e.file;
                    return o.test(t)
                })
            })```
hm. the first bit is returning false :confused:
```window.rollouts = n(55).get("rollouts");
{get: ƒ, getAll: ƒ}
window.rollouts.get = () => true;
() => true```
:slightly_smiling_face: I’ll try this
woops! the file also must match: `/\/\/(a2\.soundcloud\.test|a-v2\.sndcdn\.com)/`
```x.stack = `Error: yo
    at <https://a-v2.sndcdn.com/definitely-not-anonymous.js>:1:2````

sequoia [1:23 PM]
success?

sequoia [1:24 PM]
added this Plain Text snippet: request params 
url: “https://api.airbrake.io/api/v3/projects/129825/notices?key=04b3f291e3db982608ca3611c0e3f6fe”
body: “{”id”:“”,“errors”:[{“type”:“Exception”,“message”:“[$ Hi soundcloud dev people!!] (Check out my mixtape: https://sequoia.makes.software/)“,”backtrace”:[{“function”:“”,“file”:“<https://a-v2.sndcdn.com/definitely-not-anonymous.js>“,”line”:1,“column”:2}]}],“context”:{“language”:“JavaScript”,“severity”:“error”,“notifier”:{“name”:“airbrake-js”,“version”:“0.9.0”,“url”:“https://github.com/airbrake/airbrake-js”},“history”:[{“type”:“xhr”,“method”:“GET”,“url”:“https://wis.sndcdn.com/cfciJYMMou1a_m.json”,“date”:“2018-06-20T16:40:27.292Z”,“statusCode”:200,“duration”:389},{“type”:“xhr”,“method”:“GET”,“url”:“https://api.soundcloud.com/e1/me/track_reposts/ids?limit=5000&linked_partitioning=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:26.958Z”,“statusCode”:200,“duration”:804},{“type”:“xhr”,“method”:“GET”,“url”:“https://wis.sndcdn.com/0QWBwdxOp5Ls_m.json”,“date”:“2018-06-20T16:40:27.286Z”,“statusCode”:200,“duration”:510},{“type”:“xhr”,“method”:“GET”,“url”:“https://wis.sndcdn.com/js2Rv20W2qJC_m.json”,“date”:“2018-06-20T16:40:27.296Z”,“statusCode”:200,“duration”:528},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/me/suggested/users/who_to_follow?view=recommended-first&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&limit=21&offset=0&linked_partitioning=1&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:27.277Z”,“statusCode”:200,“duration”:652},{“type”:“xhr”,“method”:“GET”,“url”:“https://cf-hls-media.sndcdn.com/playlist/0QWBwdxOp5Ls.128.mp3/playlist.m3u8?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLWhscy1tZWRpYS5zbmRjZG4uY29tL3BsYXlsaXN0LzBRV0J3ZHhPcDVMcy4xMjgubXAzL3BsYXlsaXN0Lm0zdTgiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE1Mjk1MTY5MTZ9fX1dfQ__&Signature=wBV-ZE~~IYDvH-pkA6npAasiFxdeHcWrQNv4iHet4x1AF1nEKrmPN2nTWoWDDUU0V5Yj7USDkonmWEm3XF8YgLL~Y2B47x9jCr2eW8~6TVTuO2TkFm0m1VeF-Y-nfet4KeoF4R12w~YCCYNPQ7T4nqgwpvTPMHa7XyHZkT5fUIBkjyFvcnCVHkuqm8fwMFX2iv1Hz1zpKlw0Dm-2RXz3bzGOY7qwuM2GGdpkwrkGnTvMJFq7VwMjwsMg9nKYViK~spF4MC47HQOA7uD0ndFNCTuQxMjlocN67G7z2RM3lxPm1CXMmBWRnD9O9qdAMPk8HSoyluQWZEL8sm8L8tzcVA__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ”,“date”:“2018-06-20T16:40:27.390Z”,“statusCode”:200,“duration”:1011},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/tracks/460374384/comments?threaded=0&filter_replies=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&limit=200&offset=0&linked_partitioning=1&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:28.052Z”,“statusCode”:200,“duration”:393},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/tracks/460328352/comments?threaded=0&filter_replies=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&limit=200&offset=0&linked_partitioning=1&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:28.061Z”,“statusCode”:200,“duration”:400},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/tracks/460533687/comments?threaded=0&filter_replies=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&limit=200&offset=0&linked_partitioning=1&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:28.069Z”,“statusCode”:200,“duration”:395},{“type”:“xhr”,“date”:“2018-06-20T16:40:28.432Z”,“url”:“https://cf-hls-media.sndcdn.com/media/0/31762/0QWBwdxOp5Ls.128.mp3?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLWhscy1tZWRpYS5zbmRjZG4uY29tL21lZGlhLyovKi8wUVdCd2R4T3A1THMuMTI4Lm1wMyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTUyOTUxNDYyN319fV19&Signature=pcYXPcM5Mnmw6Jv29d9n0owFWtboudBnNRjj0~K6iE9dBf1uNiddBmmZmkYAh49oiRj99uSN7QnyCTeYGdSQhzuNdRpjZ7bnZ7Rhj7U~fe1hkXX1Fxu6rjGUX7SX1NCUVLmiFwPnvK6NuOR17xxSdjostyY2rV3MHIFbIQYegxSUT558niz0EdeHUsfGDmz59tUWVqUaLCXl53hE1~ASGk1rdaY5q7S7tp4kwxX8aYkUe1zqKn0~7W-E5BKZYgrl1ozZ-CWpjCtKOzIXQyq8ZPl0UEqO-150Ia0Pu8D-1nEakXlEsD-DY~R3IHfKZLbkv0Ico~hBgj4azBnt3IOb5g__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ”,“method”:“GET”,“statusCode”:200,“duration”:45},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/me/followers/ids?limit=5000&linked_partitioning=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:40:28.214Z”,“statusCode”:200,“duration”:303},{“type”:“xhr”,“date”:“2018-06-20T16:40:28.490Z”,“url”:“https://cf-hls-media.sndcdn.com/media/31763/79410/0QWBwdxOp5Ls.128.mp3?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLWhscy1tZWRpYS5zbmRjZG4uY29tL21lZGlhLyovKi8wUVdCd2R4T3A1THMuMTI4Lm1wMyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTUyOTUxNDYyN319fV19&Signature=pcYXPcM5Mnmw6Jv29d9n0owFWtboudBnNRjj0~K6iE9dBf1uNiddBmmZmkYAh49oiRj99uSN7QnyCTeYGdSQhzuNdRpjZ7bnZ7Rhj7U~fe1hkXX1Fxu6rjGUX7SX1NCUVLmiFwPnvK6NuOR17xxSdjostyY2rV3MHIFbIQYegxSUT558niz0EdeHUsfGDmz59tUWVqUaLCXl53hE1~ASGk1rdaY5q7S7tp4kwxX8aYkUe1zqKn0~7W-E5BKZYgrl1ozZ-CWpjCtKOzIXQyq8ZPl0UEqO-150Ia0Pu8D-1nEakXlEsD-DY~R3IHfKZLbkv0Ico~hBgj4azBnt3IOb5g__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ”,“method”:“GET”,“statusCode”:200,“duration”:39},{“type”:“xhr”,“date”:“2018-06-20T16:40:28.537Z”,“url”:“https://cf-hls-media.sndcdn.com/media/79411/159240/0QWBwdxOp5Ls.128.mp3?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLWhscy1tZWRpYS5zbmRjZG4uY29tL21lZGlhLyovKi8wUVdCd2R4T3A1THMuMTI4Lm1wMyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTUyOTUxNDYyN319fV19&Signature=pcYXPcM5Mnmw6Jv29d9n0owFWtboudBnNRjj0~K6iE9dBf1uNiddBmmZmkYAh49oiRj99uSN7QnyCTeYGdSQhzuNdRpjZ7bnZ7Rhj7U~fe1hkXX1Fxu6rjGUX7SX1NCUVLmiFwPnvK6NuOR17xxSdjostyY2rV3MHIFbIQYegxSUT558niz0EdeHUsfGDmz59tUWVqUaLCXl53hE1~ASGk1rdaY5q7S7tp4kwxX8aYkUe1zqKn0~7W-E5BKZYgrl1ozZ-CWpjCtKOzIXQyq8ZPl0UEqO-150Ia0Pu8D-1nEakXlEsD-DY~R3IHfKZLbkv0Ico~hBgj4azBnt3IOb5g__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ”,“method”:“GET”,“statusCode”:200,“duration”:46},{“type”:“xhr”,“date”:“2018-06-20T16:40:28.594Z”,“url”:“https://cf-hls-media.sndcdn.com/media/159241/318900/0QWBwdxOp5Ls.128.mp3?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLWhscy1tZWRpYS5zbmRjZG4uY29tL21lZGlhLyovKi8wUVdCd2R4T3A1THMuMTI4Lm1wMyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTUyOTUxNDYyN319fV19&Signature=pcYXPcM5Mnmw6Jv29d9n0owFWtboudBnNRjj0~K6iE9dBf1uNiddBmmZmkYAh49oiRj99uSN7QnyCTeYGdSQhzuNdRpjZ7bnZ7Rhj7U~fe1hkXX1Fxu6rjGUX7SX1NCUVLmiFwPnvK6NuOR17xxSdjostyY2rV3MHIFbIQYegxSUT558niz0EdeHUsfGDmz59tUWVqUaLCXl53hE1~ASGk1rdaY5q7S7tp4kwxX8aYkUe1zqKn0~7W-E5BKZYgrl1ozZ-CWpjCtKOzIXQyq8ZPl0UEqO-150Ia0Pu8D-1nEakXlEsD-DY~R3IHfKZLbkv0Ico~hBgj4azBnt3IOb5g__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ”,“method”:“GET”,“statusCode”:200,“duration”:33},{“type”:“load”,“target”:“[object HTMLDocument]“,”date”:“2018-06-20T16:40:29.053Z”},{“type”:“xhr”,“method”:“post”,“url”:“https://l9bjkkhaycw6f8f4.soundcloud.com/v1/events”,“date”:“2018-06-20T16:40:30.424Z”,“statusCode”:200,“duration”:171},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/users/39868465/conversations/unread?force=1&limit=20&offset=0&linked_partitioning=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:45:25.490Z”,“statusCode”:200,“duration”:326},{“type”:“xhr”,“method”:“GET”,“url”:“https://api-v2.soundcloud.com/users/39868465/conversations/unread?force=1&limit=20&offset=0&linked_partitioning=1&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&app_version=1529495417&app_locale=en”,“date”:“2018-06-20T16:52:35.973Z”,“statusCode”:200,“duration”:4686},{“type”:“xhr”,“method”:“POST”,“url”:“https://api-v2.soundcloud.com/errors?errors=1&app_version=1529495417&client_id=e7pCwTm0KONbBx2NoD5a0k3kP474wQnC&app_locale=en”,“date”:“2018-06-20T17:17:56.278Z”,“statusCode”:204,“duration”:240645},{“type”:“xhr”,“date”:“2018-06-20T17:21:30.899Z”,“url”:“https://api.airbrake.io/api/v3/projects/129825/notices?key=04b3f291e3db982608ca3611c0e3f6fe”,“method”:“POST”,“statusCode”:201,“duration”:26034}],“userAgent”:“Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36”,“url”:“https://soundcloud.com/stream”,“rootDirectory”:“https://soundcloud.com”,“environment”:“production”,“version”:“1529495417”,“user”:{“id”:“39868465"}},“params”:{},“environment”:{},“session”:{}}”
Collapse 

sequoia [1:24 PM]
please do not take my user id & spam soundcloud ’til they ban me thank you :pray:
how many requests should I send… XD