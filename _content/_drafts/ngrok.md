Let's say someone asks you for a change to the behavior or appearance of a web UI. Once you make the requested change, it's a good idea to get the person who made the request to **take a look and verify that the change you made is what they wanted.**

You can commit the code, open a PR, merge, and wait 'til it's deployed to gold or production and ask them to verify it there. But wouldn't it be better to have the change verified _before_ the code is on a one-way track to production? Why not ask them to come over to your desk and take a look at the new behavior/UI before committing it? Great idea, but **if you or they are remote, this is impossible.**

## Enter ngrok

[ngrok](https://ngrok.com/) is a very simple-to-use tool that creates a tunnel from the public internet to your local machine, and exposes your app on a one-off domain like `http://a3c7d05060f4.ngrok.io`.

## Getting set up

It's pretty easy:

1.  [Log in here](https://ngrok.com/)
2.  Follow the instructions (install ngrok & set auth token, it's all on-screen [here](https://dashboard.ngrok.com/get-started/setup))

## Using ngrok

Even easier! Start your app:

```sh
➜  ./start-web-server.sh
server listening on http://localhost:3000
```

Then open a tunnel (in another terminal), in my case `http` over port `3000`:

```
➜  ngrok http 3000
```

```
ngrok by @inconshreveable                                            (Ctrl+C to quit)

Session Status                online
Account                       sequoia@plz.no
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://f42089eaf373.ngrok.io -> http://localhost:3000
Forwarding                    https://f42089eaf373.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Then copy the external address (`http://f42089eaf373.ngrok.io`) and send it to the person you want to be able to access your local instance! If you want a "fixed" subdomain, use the [`-subdomain`](https://ngrok.com/docs#http-subdomain) switch:

```
ngrok http -subdomain sequoia 8080
```

```
ngrok by @inconshreveable                                       (Ctrl+C to quit)

Session Status                online
Account                       sequoia@plz.no
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                ✨ http://sequoia.ngrok.io -> http://localhost:3000
Forwarding                ✨ https://sequoia.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## More features

In addition to seeing requests logged in the shell, ngrok runs a local "dashboard" at [http://localhost:4040](http://localhost:4040). Here you can see the details of each request and **replay requests**. This is super useful! Imagine you're developing a service that responds to a [webhook](https://www.twilio.com/docs/glossary/what-is-a-webhook) request from Github when a pull request is closed. The naive approach would be to deploy your app somewhere where github can access it (a publicly routable address) and to create & close a PR over and over to get Github to send webhook payloads over and over while you develop. Contrast that with the ngrok workflow:

1.  Run your app **locally**
2.  Expose your local instance with ngrok
3.  Configure your github webhook to point to your app's public (`ngrok.io`) address
4.  Open & close **one** PR
5.  In the [local ngrok dashboard](http://localhost:4040), **replay** the request as many times as you want while you refine & fix your locally running code

Much easier, no? See [this post](https://sendgrid.com/blog/test-webhooks-ngrok/) for a more detailed explanation of this workflow.

ℹ️ &nbsp;You can find other features & configuration settings at [https://ngrok.com/docs](https://ngrok.com/docs).

## The End

That's a basic intro to using ngrok. It makes it easy to share your local web services with people outside your network, route traffic from the wider internet to your box, and replay requests. If you have other great uses for ngrok or know of other approaches to solving the problem ngrok solves, do let me know!
