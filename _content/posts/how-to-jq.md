---
title: "Parsing JSON at the CLI: A Practical Introduction to `jq` (and more!)"
date: December 21, 2020
description: "JSON is everywhere you look these days. The `jq` tool makes it easy to slice, dice, and transform JSON from the command line. It can be hard to map the official manual to real-world applications, so let's look at some practical examples of `jq` and its cousins that handle YAML & HTML!"
tags:
  - CLI
  - kubernetes
  - prometheus
  - JSON
  - YAML
  - HTML
---

`jq` is a command line tool for parsing and modifying JSON. It is useful for extracting relevant bits of information from tools that output JSON, or REST APIs that return JSON. Mac users can install `jq` using homebrew (`brew install jq`); see [here](https://stedolan.github.io/jq/download/) for more install options.

In this post we'll examine a couple "real world" examples of using `jq`, but let's start with...

## `jq` Basics

The most basic use is just tidying & pretty-printing your JSON:

```sh
$ USERX='{"name":"duchess","city":"Toronto","orders":[{"id":"x","qty":10},{"id":"y","qty":15}]}'
$ echo $USERX | jq '.'
```

outputs

```json
{
  "name": "duchess",
  "city": "Toronto",
  "orders": [
    {
      "id": "x",
      "qty": 10
    },
    {
      "id": "y",
      "qty": 15
    }
  ]
}
```

I like this pretty-printing/formatting capability so much, I have an alias that formats JSON I've copied (in my OS "clipboard") & puts it back in my clipboard:

```sh
alias jsontidy="pbpaste | jq '.' | pbcopy"
```

The `'.'` in the `jq '.'` command above is the simplest jq "filter." The dot takes the input JSON and outputs it as is. You can read more about filters [here](https://stedolan.github.io/jq/manual/#Basicfilters), but the bare minimum to know is that `.keyname` will filter the result to a property matching that key, and `[index]` will match an array value at that index:

```sh
$ echo $USERX | jq '.name'
"duchess"
$ echo $USERX | jq '.orders[0]'
{
  "id": "x",
  "qty": 10
}
```

And `[]` will match _each_ item in an array:

```sh
echo $USERX | jq '.orders[].id'
"x"
"y"
```

Filtering output by value is also handy! Here we use `|` to output the result of one filter into the input of another filter and `select(.qty>10)` to select only orders with `qty` value greater than 10:

```sh
echo $USERX | jq '.orders[]|select(.qty>10)'
{
  "id": "y",
  "qty": 15
}
```

One more trick: filtering by **key** name rather than value:

```sh
$ ORDER='{"user_id":123,"user_name":"duchess","order_id":456,"order_status":"sent","vendor_id":789,"vendor_name":"Abe Books"}'
$ echo $ORDER | jq '.'
{
  "user_id": 123,
  "user_name": "duchess",
  "order_id": 456,
  "order_status": "sent",
  "vendor_id": 789,
  "vendor_name": "Abe Books"
}
$ echo $ORDER | jq 'with_entries(select(.key|match("order_")))'
{
  "order_id": 456,
  "order_status": "sent"
}
```

(cheat sheet version: `with_entries(select(.key|match("KEY FILTER VALUE")))`)

Check out [more resources](#more-resources) below to learn about other stuff jq can do!

## A Usecase: Debugging Some Prometheus Metrics

I have a prometheus metric showing up locally that doesn't look quite right:

```nohilight
async_task_total{task_name="/Users/duchess/charmoffensive/toodle-app/pkg/web/page/globals.go(189):(*GlobalsPopulator).Populate"} 6
```

The fact that the `task_name` value is a _filename_ is a red flag–[it's bad to have labels with high cardinality](https://prometheus.io/docs/practices/naming/#labels) and I'm not sure how many of these there are. I want to find out:

1.  What do these `task_name` labels look like in production?
2.  How many unique values are there for these labels?

### 1\. Getting the label values in production

At my company there is a <abbr title="Command Line Interface">CLI</abbr> tool we'll call `pquery` that allows prometheus metrics to be queried from the command line, and it outputs JSON–how conventient! I use this tool in the following examples. You don't have this tool, but fear not: [this wonderful post](https://learndevops.substack.com/p/hitting-prometheus-api-with-curl) explains how to query prometheus using [curl](https://curl.se/) which is essentially what `pquery` does.

Using `pquery` we can view prometheus metrics from our various clusters. But even if we filter for this exact metric name, it's more data than we can easily look at. We'll use `wc -l` (wordcount: count lines) to get a rough idea of how much data we're working with:

```sh
$ pquery 'async_task_total' | wc -l
316117
```

316,117 lines of JSON! Oof! We want to iterate over the metrics. But what jq filter do we need to access the array of metrics? I find `head` useful for figuring out what the top level keys are for a large json structure:

```sh
$ pquery 'async_task_total' | head -n 20
{
    "data": {
        "result": [
            {
                "metric": {
                    "__name__": "async_task_total",
                    "app": "toodle-app-alpha",
                    "instance": "10.55.55.55:9393",
                    "job": "toodle-app-alpha",
                    "kubernetes_pod_name": "toodle-app-b446b7ccd-6mls6",
                    "namespace": "noweb",
                    "netpol": "toodle-app",
                    "node_name": "gke-production-04-3455c6df-j526",
                    "release": "toodle-app",
                    "task_name": "/charmoffensive/toodle-app/pkg/core/user/user.go(67):GetAccountDetails"
                },
                "value": [
                    1600981630.344,
                    "2"
```

You can also use `jq 'keys'` if you just want the key names:

```sh
$ pquery 'async_task_total' | jq 'keys'
[
  "data",
  "status"
]
```

Anyway we can see from above that `.data.result` is the "filter" path for the metrics themselves. Let's get the **first result** (`[0]`) of this array so we can see what one metric looks like:

```sh
$ pquery 'async_task_total' | jq '.data.result[0]'
{
  "metric": {
    "__name__": "async_task_total",
    "app": "toodle-app-alpha",
    "instance": "10.55.55.55:9393",
    "job": "toodle-app-alpha",
    "kubernetes_pod_name": "toodle-app-b446b7ccd-6mls6",
    "namespace": "noweb",
    "netpol": "toodle-app",
    "node_name": "gke-production-04-3455c6df-j526",
    "release": "toodle-app",
    "task_name": "/charmoffensive/toodle-app/pkg/core/user/user.go(67):GetAccountDetails"
  },
  "value": [
    1600981906.069,
    "2"
  ]
}
```

Oops! That `app` value (`toodle-app-alpha`) indicates a mistake: I'm only interested in results from the `toodle-app` app, _not_ from other apps that may also emit this metric (such as the `alpha` deployment we see here). We could `select` for this using jq, but [`promql` already lets us filter by metric names](https://prometheus.io/docs/prometheus/latest/querying/basics/) so we'll do that instead: `pquery 'async_task_total{app="toodle-app"}'`.

We're interested in the `task_name` value in the `metric` object, so let's pluck that from **each** item in the array above:

```sh
$ pquery 'async_task_total{app="toodle-app"}' \
| jq '.data.result[].metric.task_name'
"/charmoffensive/toodle-app/pkg/core/guides/guides.go(411):generateGuideFromDefinition"
"/charmoffensive/toodle-app/pkg/core/place/place.go(122):FetchPlaceDetailForCollection"
"/charmoffensive/toodle-app/pkg/core/place/place.go(132):FetchPlaceDetailForCollection"
"/charmoffensive/toodle-app/pkg/core/user/user.go(67):GetAccountDetails"
"/charmoffensive/toodle-app/pkg/core/user/user.go(73):GetAccountDetails"
"/charmoffensive/toodle-app/pkg/web/page/area.go(160):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area.go(166):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area.go(172):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area_category.go(140):(*areaCategoryView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area_category.go(146):(*areaCategoryView).fetchData"
{... + 18009 more lines}
```

> 📝 Update: It was pointed out to me that as this is a post about `jq`, not about `promql`, a `jq` solution is more appropriate here. I'd originally used promql because it's more efficient to filter on the server when possible. Here's the `jq` version which uses the <a href="https://stedolan.github.io/jq/manual/#select(boolean_expression)">`select` filter</a>:
> 
> ```sh
> $ pquery 'async_task_total' \
> | jq '.data.result[].metric | select(.app == "toodle-app").task_name'
> ```
> Back to the post...


Eighteen thousand values for that label!? That's bad!! But wait a tic–if other labels are varying, some of these may actually be duplicates. Let's sort them and see:

```sh
$ pquery 'async_task_total{app="toodle-app"}' \
| jq '.data.result[].metric.task_name' | sort | head -n10
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/guides/guides.go(411):generateGuideFromDefinition"
"/charmoffensive/toodle-app/pkg/core/guides/guides.go(411):generateGuideFromDefinition"
"/charmoffensive/toodle-app/pkg/core/guides/guides.go(411):generateGuideFromDefinition"
```

Yep: most of these are actually not unique names. `uniq` to the rescue!

```sh
$  pquery 'async_task_total{app="toodle-app"}' \
| jq '.data.result[].metric.task_name' | sort | uniq
"/charmoffensive/toodle-app/pkg/core/collection/resolvers/query.go(221):(*queryResolver).Verticals"
"/charmoffensive/toodle-app/pkg/core/guides/guides.go(411):generateGuideFromDefinition"
"/charmoffensive/toodle-app/pkg/core/place/place.go(122):FetchPlaceDetailForCollection"
"/charmoffensive/toodle-app/pkg/core/place/place.go(132):FetchPlaceDetailForCollection"
"/charmoffensive/toodle-app/pkg/core/user/user.go(67):GetAccountDetails"
"/charmoffensive/toodle-app/pkg/core/user/user.go(73):GetAccountDetails"
"/charmoffensive/toodle-app/pkg/web/page/area.go(160):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area.go(166):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area.go(172):(*areaView).fetchData"
"/charmoffensive/toodle-app/pkg/web/page/area_category.go(140):(*areaCategoryView).fetchData"
{... more}
```

Now I've got a full list of all the _distinct_ values for this label, which answers my first question.

### How many unique values are there for these labels?

Well that's pretty easy at this point...

```sh
$ pquery 'async_task_total{app="toodle-app"}' \
| jq '.data.result[].metric.task_name' | sort | uniq | wc -l
92
```

Ninety-two! Not so bad. Mystery solved, and I can say with reasonable confidence "the cardinality of these labels isn't terribly high, I'm leaving this alone 😅"

## More jq Use Cases

### Getting The Statuses of a Kubernetes Deployment

Techniques and features used in this task:

*   Concatenating different fields as strings!
*   Using `-r` to output **raw** output rather than escaped/quoted

```sh
$ kubectl get deployments toodle-app -o json \
| jq '.status.conditions[]|(.reason + ": " + .message)' -r
NewReplicaSetAvailable: ReplicaSet "toodle-app-545b65cfd4" has successfully progressed.
MinimumReplicasAvailable: Deployment has minimum availability.
```

### Getting All Kubernetes Annotations with the `prometheus.` Prefix

```sh
$ kubectl get service toodle-app -o json \
| jq '.metadata.annotations | with_entries(select(.key|match("prometheus")))'
{
  "prometheus.io/path": "/varz",
  "prometheus.io/port": "9393",
  "prometheus.io/scrape": "true"
}
```

### There's a Version for yaml as well!!

```sh
$ cat cronjob.yaml
apiVersion: batch/v1beta1
kind: CronJob
spec:
  schedule: "*/1 * * * *" # once per minute
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: deployment-scanner
              image: deployment-scanner:38

$ brew install yq
$ yq '.spec.jobTemplate.spec.template.spec.containers[0].image' cronjob.yaml
"deployment-scanner:38"
```

I used this to build a new docker image tag each time I incremented the image value in cronjob.yaml, before applying the configuration (while I was developing a kubernetes cronjob locally):

```sh
docker build -t $(yq '.spec.jobTemplate.spec.template.spec.containers[0].image' cronjob.yaml -r) . && kubectl apply --filename=cronjob.yaml
```

### And a similar tool for HTML?!

```sh
➜ curl -sL https://postmates.com/feed | pup 'head title'
<title>
  postmates: Food Delivery, Groceries, Alcohol - Anything from Anywhere
</title>
➜ curl -sL https://postmates.com/feed | pup 'head meta[charset]'
<meta charset="UTF-8">
➜ curl -sL https://postmates.com/feed | pup 'head meta[charset] json{}'
[
  {
  "charset": "UTF-8",
  "tag": "meta"
  }
]
```

## The End

What do you use `jq` or `yq` for? Will you be adding `pup` to your workflow? Sound off in the comments, which is to say "drop me a line!"

## More Resources

*   [jq play](https://jqplay.org/): a `jq` playground to try stuff out
*   [TFM](https://stedolan.github.io/jq/manual/): The Friendly Manual
*   [yq](https://github.com/mikefarah/yq): like jq for yaml
*   [pup](https://github.com/ericchiang/pup): like JQ for HTML!

# Comments

> I needed this tutorial 6 months ago (and 6 months before that, and 6 months before that). :D Highly recommend looking at and maybe including [`gron`](https://github.com/tomnomnom/gron) in this as a very nice complement to jq. It fills in some use cases in a very straightforward way that are pretty cumbersome in jq, such as finding a field deeply nested in an optional parent.

\- heleninboodler, <time datetime="2020-12-21 20:00:00 UTC">December 21, 2020</time>

Thanks helen, I didn't know about that tool & it does look quite useful! I'd probably add it into the "figuring out the structure of the data" step in the workflow described above, to complement `head`. Thanks for the tip!

## More Comments

👉 Some good discussion & lots of tips & links to similar articles on [hackernews](https://news.ycombinator.com/item?id=25498364).