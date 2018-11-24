---
title: "Session Management with Microservices"
date: May 29, 2017
description: >
    Microservices make some tasks easier and introduce some challenges where they didn't exist before. In this post we'll look at sharing sessions across microservices on the `now` platform.
---

The microservice architecture is the New Hot Thing in server application architecture and it presents various benefits, including ease of scaling and the ability to use multiple programming languages across one application. As we know, however, there's no such thing as free lunch! This flexibility comes with costs and presents some challenges that are not present in classic "monolith" applications. In this post we'll examine one such challenge: sharing sessions across services.

## Sharing Sessions

When we split authentication off from a "monolith" application, we have two challenges to contend with:

1. **Sharing cookies between the auth server(s) and application server(s)**
   On one server on one domain, this was not an issue. With multiple servers on multiple domains, it is. We'll address this challenge by **running all servers under one domain** and proxying to the various servers. (Don't worry, it's easier than it sounds!)
2. **Sharing a session store across server(s)**
   With a single monolith, we can write sessions to disk, store them in memory, or write them to a database running on the same container. This won't work if we want to be able to scale our application server to many instances as they will not share memory or a local filesystem. We'll address this challenge by **externalizing our session store and sharing it across instances**.

For the purposes of demonstrating session sharing, we'll be creating two simple servers: `writer`, our "auth" server that *sets and modifies* sessions, and `reader`, our "application" server that *checks login and reads* sessions. Code for this demo can be found here: <https://github.com/Sequoia/sharing-cookies>.

*NB: You may be thinking "let's use JWTs! They are stateless and circumvent the cookie sharing issue completely." Using JWTs to reimplement sessions is [a bad idea for various reasons](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/), so we won't be doing it here*

## Setting up "Auth" Server

In order to share sessions across servers, we'll use an external redis server to store session info. I'm using a free redis instance from <https://redislabs.com/> for this demo.

### Setup

Here we set up an express server with redis-based session tracking and run our server on port `8090`.

```js
// writer/index.js
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const app = express();

const redisOptions = {
  url : process.env.REDIS_SESSION_URL
}

const sessionOptions = {
  store: new RedisStore(redisOptions),
  secret: process.env.SESSION_SECRET,
  logErrors: true,
  unset: 'destroy'
}
 
app.use(session(sessionOptions));

app.listen(8090, function(){
  console.log('WRITE server listening');
});
```

### Environment Variables

Our application relies on `REDIS_SESSION_URL` and `SESSION_SECRET` being available as environment variables. These are externalized both for security and to allow us to share these values across different application instances.

### Routes

For our demo, our express-based auth server will have three paths:

1.  `/login`: set a user session.
    ```js
    app.get('/login', function(req, res){
      // .. insert auth logic here .. //
      if(!req.session.user){
        req.session.user = {
          id : Math.random()
        };
      }

      res.json({
        message : 'you are now logged in',
        user : req.session.user
      });
    });
    ```
2.  `/increment`: increment a counter on the session (update session data)
    ```js
    app.get('/increment', function incrementCounter(req, res){
      if(req.session.count){
        req.session.count++;
      }else{
        req.session.count = 1;
      }
      res.json({
        message : 'Incremented Count',
        count: req.session.count
      });
    });
    ```
3.  `/logout`: destroy a session
    ```js
    app.get('/logout', function destroySession(req, res){
      if(req.session){
        req.session.destroy(function done(){
          res.json({
            message: 'logged out : count reset'
          });
        });
      }
    });
    ```

### Running the Server

Our server is set up to run via `npm start` in our package.json file:

```js
...
  "scripts" : {
    "start" : "node index.js"
  }
...
```

We start by running `npm run` with the appropriate environment variables set. There are many ways to set environment variables, here we will simply pass them at startup time:

```no-highlight
$ REDIS_SESSION_URL=redis://hostname:port?password=s3cr3t SESSION_SECRET='abc123' npm start
```

Now, assuming redis connected properly, we can start testing our URLS

`GET localhost:8090/login`:

```json
{
  "message": "you are now logged in",
  "user": {
    "id": 0.36535326065695717
  }
}
```

`GET localhost:8090/increment`

```json
{
  "message": "Incremented Count",
  "count": 1
}
```

It works! To verify that the session is independent of the server instance, you can try shutting down the server, restarting it, and checking that your `user.id` and `count` remain intact.

### Checking our Session

We can see our sessions in redis by connecting with the `redis-cli`:

```no-highlight
$ redis-cli -h <host> -p <port> -a <password>
host:43798> keys *
1) "sess:q5t7q67lzOsCJDca-kvT63Yk6n6kVvpL"
host:43798> get "sess:q5t7q67lzOsCJDca-kvT63Yk6n6kVvpL"
"{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":0.36535326065695717},\"count\":1}"
```

## Setting up Our "App" Server

The application (`reader`) server has one single path:

1. `/`: read current count.

The server setup code is the same as above, with the exception that our server is run on `8080` rather than `8090` so we can run both locally at the same time.

### Requiring Login

In order to ensure users who hit our "application" server have logged in, we'll add a middleware that checks that the session is set and it has a `user` key:

```js
// reader/index.js
app.use(function checkSession(req, res, next){
  if(!req.session.user){
    //alternately: res.redirect('/login')
    return res.json(403, {
      'message' : 'Please go "log in!" (set up your session)',
      'login': '/login'
    });
  }else{
    next();
  }
});
```

Then we'll add our single route:

```js
// reader/index.js
app.get('/', function displayCount(req, res){
  res.json({
    user : req.session.user,
    count: req.session.count
  })
});
```

### Running the server

Start this server as we started the other:

1. Pass the appropriate environment variables
2. `npm run`

Now we can check that it works:

`GET localhost:8080`

```json
{
  "user": {
    "id": 0.36535326065695717
  },
  "count": 1
}
```

Try it from a private tab or different browser, where we haven't yet logged in:

`GET localhost:8080`

```json
{
  "message": "Please go \"log in!\" (set up your session)",
  "login":"/login"
}
```

It works!

### I thought Cookies Couldn't Be Shared?!

In fact, browsers do not take port number into consideration when determining what the host is and what cookies belong to that host! This means that we can run our auth server locally on `:8090` and the app server on `:8080` and they can share cookies, as long as we use the hostname `localhost` for both!

## Deploying

This works fine locally, now let's see it in The Cloud. We'll be using <https://zeit.co/now> for hosting. `now` is microservice oriented hosting platform that allows us to easily deploy Node.js applications and compose application instances to work together, so it's a great choice for this demo!

`now` expects node.js applications to start with `npm start`, luckily we've already configured our application to do that, so all that's left to do is to deploy it!

```no-highlight
$ cd writer
$ now     # missing environment variables...
> Deploying ~/projects/demos/sharing-cookies/writer under sequoia
> Using Node.js 7.10.0 (default)
> Ready! https://writer-xyz.now.sh (copied to clipboard) [1s]
> Synced 2 files (1.19kB) [2s]
> Initializing…
> Building
...
```

This will deploy our application to `now`, but it won't actually work, because the application will not have the environment variables it needs. We can fix this by putting the environment variables in a file called `.env` (that we **do not check in to git!!!**) and passing that file as a parameter to `now`. It will read the file and load those variables into the environment of our deployment.


```no-highlight
# .env
REDIS_SESSION_URL="your redis url here"
SESSION_SECRET="abc123"
```

```no-highlight
$ echo '.env' >> ../.gitignore  # important!!
$ now --dotenv=../.env
> Deploying ~/projects/demos/sharing-cookies/writer under sequoia
> Using Node.js 7.10.0 (default)
> Ready! https://writer-gkdldldejq.now.sh (copied to clipboard) [1s]
> Synced 2 files (1.19kB) [2s]
> Initializing…
> Building
```

Once the command finishes, we can load that URL in our browser:

`GET https://writer-gkdldldejq.now.sh/login`

```json
{
"message": "you are now logged in",
  "user": {
    "id": 0.31483764592524177
  }
}
```

### Deploying the Application Server (`reader`)

We repeat the above steps in our `/reader` directory, passing **the same `.env` file** to `now --dotenv`...

```no-highlight
$ cd ../reader
$ now --dotenv=../.env
> Deploying ~/projects/demos/sharing-cookies/reader under sequoia
> Using Node.js 7.10.0 (default)
> Ready! reader-irdrsmayqv.now.sh (copied to clipboard) [1s]
> Synced 2 files (1.19kB) [2s]
> Initializing…
> Building
...
```

Once it's done we check via our browser...

`GET https://reader-irdrsmayqv.now.sh`

```json
{
  "message": "Please go \"log in!\" (set up your session)",
  "login": "/login"
}
```

We're not logged in! What happened?

We noted above that in order to share sessions, we needed to share two things:

1. A session store (redis)
2. **Cookies**

Because our servers run on different domains now, we're not sharing cookies. We'll fix that with a simple reverse-proxy set up `now` refers to as "aliases."

## Aliases

We want both of our applications running on the same domain so they can share cookies (as well as other reasons including avoiding extra DNS lookups and obviating the need for CORS headers). `now` allows aliasing to any arbitrary subdomain under `now.sh`, and I've chosen `counter-demo.now.sh` for this post.

We want routing to work as follows:

* `/`: application server (`https://reader-irdrsmayqv.now.sh/`)
* `login`, `increment`, `logout`: "auth" server (`https://writer-gkdldldejq.now.sh/`)

To configure multiple forwarding rules for one "alias" (domain), we'll first define them in a json file:

```js
{
  "rules" : [
    { "pathname" : "/login", "dest" : "writer-gkdldldejq.now.sh" },
    { "pathname" : "/increment", "dest" : "writer-gkdldldejq.now.sh" },
    { "pathname" : "/logout", "dest" : "writer-gkdldldejq.now.sh" },
    { "dest" : "reader-irdrsmayqv.now.sh" }
  ]
}
```

We pass these to `now alias` using the `--rules` switch, along with our desired subdomain:

```
$ now alias counter-demo.now.sh --rules=./now-aliases.json
> Success! 3 rules configured for counter-demo.now.sh [1s]
```

Now to try it out:

![logging into counter-demo.now.sh](/img/counter-demo.gif)

It works! Two servers running two separate applications, each sharing sessions and cookies.

## Next Steps

This is a rudimentary reverse proxy set up, but with this in place we can...

1. Deploy new versions of our application and switch the alias to point to them, allowing us to switch back if there's a problem
2. Run any number of applications in different containers (yes, docker containers!) while still presenting one face to the client
3. Proxy requests through to external servers (a server run by your IT department) or external services (AWS lambda etc.), still presenting a single domain to the client
4. Scale our application server up or down (`now scale reader-irdrsmayqv.now.sh 2`) without breaking our session management system
5. Turn the whole thing off and turn it back on again without disrupting user sessions.

Now go try it out! https://github.com/Sequoia/sharing-cookies

# Comments

> Really nice article, but I think the last part (aliases) should be longer and more in-depth. The current implementation is dependent on now.sh's particular feature and the actual mechanism isn't detailed. It would be great if you provided more implementations for the aliasing with different servers (like apache or nginx), so we could build a production environment without using now.sh. What do you think?

\- [Semmu](http://semmu.net) <time datetime="2017-06-10 16:00:57 UTC">July 10, 2017</time>

Thanks, Semmu! It's true, the approach described here is dependant on now.sh's aliasing feature, and yes, there are certainly other ways to do it! I featured now.sh here in part because it *is* very simple to use and explain. An explanation of how to tie this together with nginx (I'd pick it over Apache for this use-case) would be useful! I don't have such an explanation on hand but I'll try to write a blog post in the future describing reverse proxying with nginx. Thanks for the comment!

> Hi Sequoia, Great article! A downside I see from sharing the same session storage is the coupling between the services. In your example, if someone decides to use a different web framework (like Rails) or even a different version of express js, the session format created by the services might not be compatible anymore. In other words, we would be giving up on the tech-agnostic benefit that microservices are supposed to provide. I see two possible solutions to this problem:
> 
> 1. Make the session format standard across all the microservices and implement the standard in libraries for each language (instead of using express-session)
> 2. Have every microservice use a sidecar container that writes and reads sessions from the shared session storage. This sidecar container will return the session in a standard JSON format.
> 
> Please, let me know if you see other solutions or if I have any faulty assumption on my analysis. Thanks,
> 
> Arturo


\- Arturo <time datetime="2018-11-23 23:18:17 UTC">November 23, 2018</time>

Thank you Arturo for the thoughtful feedback! I would agree that any time that you share _any_ data between systems, each system will need to be designed to accommodate that format of data, and sessions is no exception. For _this_ example of sharing session data, I think creating a "standard" format for session data would be overkill, as the concept is the same regardless of the format of the session data or the specific tools used in each service.

Even if this were production, I would use out-of-the-box Express session to start and keep the system as simple as possible. I would consider making a cross-framework session format [only at the point where that became an actual requirement, and not a minute sooner](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it "YAGNI")! At that point, I'd tweak the easiest-to-tweak system to fit the format of the other one. Only once there were three or four different systems that all needed to share sessions would I consider a system as complex as a sidecar container (which, incidentally, would force you off the Node deploys on Now.sh and onto Docker deploys).

Thank you again for your well-considered feedback, and don't forget to [Keep It Simple](https://www.infoq.com/presentations/Simple-Made-Easy "Simple Made Easy - Rich Hickey")!