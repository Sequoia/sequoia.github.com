I had an opportunity to work with google cloud build some recently, and a few things tripped me up initially. In hindsight some are obvious, but I'm recording them here nonetheless!

## **_Every_ step** needs a new container.

If you want to run `curl webhook.com/foo` you have to create a step that

1.  pulls an image with curl installed
2.  runs that command
3.  shuts down (happens automatically of course)

Obvious in hindsight but spinning up a new image to run a single command was just unintuitive to me at first. 🤷‍♂️

## To create an image, you need an image

Consequent to the previous point, the step that actually builds your image-to-deploy runs in a container. Maybe obvious again but it can get confusing when you’re pulling an image to build a image, I got a bit mixed up at first. For example, the **kaniko-project/executor** image to build the **pm-registry/bweb** image, which is what gets deployed:

```yaml
- id: build
    name: gcr.io/kaniko-project/executor:latest
    args:
      - --context=/workspace/bweb
      - --dockerfile=/workspace/bweb/Dockerfile
      - --destination=gcr.io/pm-registry/bweb:$SHORT_SHA
      - --cache=true
      - --verbosity=warn
```

## Layer caching for your image-to-deploy _doesn’t work_ in GCB

Because `docker build` runs in an environment that gets destroyed when the build exits. 😢

## _Just kidding yes it does!!_

The magical incantation to make GCB cache your layers across build runs is, basically, to replace this:

```yaml
steps:
- name: gcr.io/cloud-builders/docker
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/image', '.']
images:
- 'gcr.io/$PROJECT_ID/image'
```

With this:

```yaml
steps:
- name: 'gcr.io/kaniko-project/executor:latest'
  args:
  - --destination=gcr.io/$PROJECT_ID/image
  - --cache=true
  - --cache-ttl=XXh
```

Kaniko (as we have used in the bweb example above) [hooks into some GCB APIs that make it cache build layers](https://cloud.google.com/cloud-build/docs/kaniko-cache#kaniko-build).

* * *

That's four-ish things I learned about GCB while working with it recently!
