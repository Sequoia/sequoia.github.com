> 1.7gb for a web app?! The size of your docker image is getting out of control!

Uh-oh... Infra is _calling you out_ for your docker image size! Larger images means...

*   [Garbage collection of stale images & containers](https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/) takes longer
*   Node storage runs out faster
*   It takes longer to build the image
*   It takes longer to send the image over the wire

All of these are small problems but **they add up!** So your image is too big–don't panic! Following a few simple steps, you can cut your docker image down to size in next to no time.

## Contents of This Post

1.  [Analyzing your image to see why it's big](#analyzing-your-image)
2.  [Chopping your image in two](#chopping-your-image-in-twain)
3.  [Cleaning up image contents](#cleaning-up-image-contents)

## Analyzing Your Image

How big is your image? Assuming you've run `docker build` to build your image locally, this is easy to check with `docker images`:

```
➜ docker images
REPOSITORY                                     TAG      IMAGE ID      CREATED       SIZE
gcr.io/cloudbuild-stage-29170/buyer-frontend   d82c28d  e4f0fd00de6d  4 months ago  1.32GB
gcr.io/pm-registry/go-af                       v0.12.1  d665db43eb95  4 months ago  911MB
```

Our `buyer-frontend` image is `1.32 GB`. But why is it so big? To figure that out, we'll use a handy tool called [dive](https://github.com/wagoodman/dive) to analyze the image layer by layer.

```
➜ dive gcr.io/cloudbuild-stage-29170/buyer-frontend:d82c28d
Image Source: docker://gcr.io/cloudbuild-stage-29170/buyer-frontend:d82c28d
Fetching image... (this can take a while for large images)
```

When it completes it will show a view like this:

![dive command output](/img/docker-dive-1.png)

There's a lot going on here!

*   The top-left panel shows you **layers**, each of which corresponds to a Dockerfile command. (If the command if it's truncated, find the _full_ command below in the "Layer Details" section.)
*   The right column shows the filesystem tree for the **currently selected layer**–more on this later
*   The bottom left is **Image Details** and does not change as you navigate through the layers

Use the arrow keys to navigate up and down in the currently selected pane. Use `tab` to switch from the Layers pane to Current Layer Contents and back. Here I've pressed the down arrow several times to get to the 309 MB `RUN make build/bin/server` layer, then used `tab` to switch focus to the Current Layer Contents panel:

![](/img/docker-dive-2.png)

By default, the Current Layer Contents shows you a full tree of the filesystem up to and including the selected layer. What's typically more useful when analyzing your image size by layer is to see what files were added by _that_ layer. Use `ctrl+u` (see "^U Unmodified" in the bottom right of the screenshot) to toggle that option _off_, which **hides files unmodified by the current layer**. This leaves visible only files that were Added, Removed, or Modified by _this_ layer:

![](/img/docker-dive-3.png)

Hello, what's this–this layer (which runs `go build` to build the actual buyer-frontend binary) add 309MB, but 237MB of that is [go mod cache](https://golang.org/ref/mod#module-cache), which **we do not need after the binary has been built!**

Now we know why this layer is larger than it should be and we can see about cleaning it up (more on this later). Repeat the process for other large layers, or just poke around and see what each layer is adding or modifying.

Now that we know how to figure out _why_ it's big, let's look at some strategies to cut down an image's size...

## Chopping Your Image in Twain

When we build a project inside a docker image, each of the things we pull or copy into that image falls into one of two categories:

1.  Stuff we need to **build** the application
2.  Stuff we need to **run** the application

Some of the things we add to our buyer-frontend image, above:

*   `make`: needed to **build** the application
*   `gcc`: needed to **build** the application
*   go modules: needed to **build** the application
*   `nginx`: needed to **run** the application
*   `./build/client/strings`: needed to **run** the application
*   the `build/bin/server` binary we create: needed to **run** the application

The stuff we need only at build time (`make`, `gcc`, etc.) **does not need to be shipped as part of the image** because **it is not needed at runtime**. We could uninstall `make` `gcc` etc. after running the build, but there is an even cleaner way: **create one image just for building the application and one image just for running the application**.

This has become a common pattern, and there are two ways to do this:

### Two Separate Docker Files ⚠️_(more complicated, use with care)_

With this approach you have one "builder" image and a separate "runtime" image. The `bweb` project currently uses this approach. From a high level:

1.  A [`Dockerfile.builder`](https://github.com/postmates/bweb/blob/9ee42f2543ed6b48c372419a122c2ca189b7b378/Dockerfile.builder) Dockerfile defines your "builder" image
2.  A [Cloudbuild builder config](https://github.com/postmates/bweb/blob/9ee42f2543ed6b48c372419a122c2ca189b7b378/cloudbuild-builder.yaml) builds your builder image
3.  A [`Dockerfile`](https://github.com/postmates/bweb/blob/9ee42f2543ed6b48c372419a122c2ca189b7b378/Dockerfile) with _only_ runtime dependencies defines your runtime image
4.  _...something something [kaniko](https://github.com/postmates/bweb/blob/9ee42f2543ed6b48c372419a122c2ca189b7b378/cloudbuild-master.yaml#L39-L46).... [indistinct mumbling]_

In fact I don't really understand how this works. If you do understand it & can draw a picture of it the process, please reach out to me!

ℹ️ _Update: on Google cloud build, build **layers** are **not** cached by default. Using the Kaniko builder allows layers to be stored, cached_, _and reused. Using Kaniko is recommended for **both** builder **and** multi-stage patterns. [Read more.](https://cloud.google.com/cloud-build/docs/kaniko-cache)_

### Multi-Stage Builds ✅_(very clear how these work, go ham_ 😄_)_

[Multi-Stage Builds](https://docs.docker.com/develop/develop-images/multistage-build/) vastly simplify this process! A multi-stage docker file has multiple `FROM` commands, the first one for the "builder" and the second one for the "runtime." Basically you install all the build dependencies in your builder, run your build, then in the runtime build you `COPY` the build artifact into your runtime image which you can then deploy.

```
# Base image for our "builder" contains the go binary which we
# do NOT need at runtime (only to build the server application binary)
FROM golang:1.7.3 AS sequoiasbuilder
WORKDIR /tmp/foo
COPY src/main.go . # copy from host into builder

# build our go binary
go build -o my-application ./main.go

# The second FROM is a new image!
# (our "runtime" image)
FROM alpine:latest # using a stripped down linux (no go!)
WORKDIR /root/

# This has _nothing_ from the builder unless we copy it in
COPY --from=sequoiasbuilder /tmp/foo/my-application .
CMD ["./my-application"]
```

Now only those things necessary for runtime will be shipped to kubernetes, and the go binary (and all the go modules that `go build` pulled in) etc. are discarded! Read [this short article](https://docs.docker.com/develop/develop-images/multistage-build/) for more.

## Cleaning Up Image Contents

Assuming you don't go the Multi-Stage route (above), or even if you did, you may be able to reduce your image size by **removing stuff you don't actually need**.

### Ensure you actually need everything you've added

Did you start building your dockerfile by copying an existing one? If so, perhaps you have a command like this near the top

```
RUN apk add --no-cache make git curl bash nginx pkgconfig zeromq-dev \
     gcc musl-dev autoconf automake build-base libtool python
```

Check that you _actually need_ all these things! Some may be cruft from another project, or the dependency may have been replaced. **This is especially important if you're building off a shared "base" image file.** When using a shared base image, it's very likely that there's stuff in there you don't need.

### Remove build tools and assets after the build completes

As we saw above using `dive`, the buyer-frontend `go build` was downloading **and caching** 237 MB of go modules, which were needed during the build but not after:

```
│ Current Layer Contents ├──────────────────────────────────────
Permission     UID:GID       Size  Filetree
drwxr-xr-x         0:0      72 MB  ├── postmates
drwxr-xr-x         0:0      72 MB  │   └── buyer-frontend
drwxr-xr-x         0:0      72 MB  │       └── build
drwxr-xr-x         0:0      72 MB  │           └── bin
-rwxr-xr-x         0:0      72 MB  │               └── server
drwx------         0:0     237 MB  └── root
drwxr-xr-x         0:0     237 MB      └── .cache
drwxr-xr-x         0:0     237 MB          └── go-build
```

The following change fixed this problem in buyer-frontend:

```
- RUN make build/bin/server
+ RUN make build/bin/server && go clean -cache
```

Other examples of this are removing `gcc`/`make`/`webpack` or removing `dev-dependencies` for a JavaScript project.

### Remove static assets when possible

You may have static assets in your image that rarely change and are not actually needed _within_ the application. For example, the buyer-frontend image contains various reports and media assets:

```
-rw-r--r--         0:0      12 MB                  ├── EconReport.pdf
-rw-r--r--         0:0      12 MB                  ├── EconReportMarket.pdf
-rw-r--r--         0:0      34 MB                  ├── Postmates-MediaKit.zip
drwxr-xr-x         0:0     4.3 MB                  ├── press-releases
```

It's not huge, but this is 62MB that gets pulled by the kubernetes controller for _every_ deployment and copied into _every_ container (we're running this image in 268 containers at the time of writing), all of which need garbage collection... it adds up!!

## Conclusion

Making your images smaller is easy, it improves infrastructure performance and it saves money. What's not to like? If you've got more tips for shaving bits off your image size, share them below!