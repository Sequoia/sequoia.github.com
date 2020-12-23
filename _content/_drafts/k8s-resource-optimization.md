We currently spend about **1/4 million dollars per month** running our applications that run in Kubernetes (not including storage & network costs). That's 250,000 reasons (per month) why we should pay attention to resource usage and work on reducing it. But how?

## Pre(r)amble

How do you write about this topic without getting into the weeds? The whole thing is just weeds.

Basically, every sentence in this post has one or more caveats. I have chosen to omit the "except in the following cases..." and "as long as the following is true..." statements. **To get a more realistic picture, close your eyes and imagine [@AJ Christensen](/users/90501 "u:90501" )​ saying, "actually it's a bit more complicated than that" after every sentence.**

But fear not! There are some "rules of thumb" that can help you realize _significant savings_ without having to become a Kubernetes expert.

## High-Level Goals

*   **Goal 1: Cost:** Use as few resources as possible to reduce how much we spend renting computers from Google (where our Kubernetes cluster ultimately runs)
*   **Goal 2: Availability:** Keep our application availability high and keep response times within acceptable ranges
*   **Goal 3: Scaling** Handle spikes in traffic gracefully (sort of a sub-goal of **Goal 2: Availability**)

## Background: How does Kubernetes Allocate Resources to Containers?

![ℹ️](/emojione/assets/png/2139.png ":information_source:") _Skip this section if you're already familiar with how requests, limits, and HPAs work._

In a Kubernetes Cluster, each "workload" (for example, a web server application) runs in one or more pods (**generally** a wrapper around a single docker container). In a Kubernetes "[deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)" we tell Kubernetes how many instances (pods) of our application to run, and what sort of resources we as operators expect each of those pods to need.

For example, we can tell Kubernetes, "Hey Kubernetes, run 3 Nginx instances; I expect each will use 1 CPU and 512Mi of RAM, but do not let it use more then 1Gi of RAM."

```
apiVersion: apps/v1
kind: Deployment
name: my-nginx
spec:
  replicas: 3              ⭐️ Run three instances
  template:
    spec:
      containers:
      - name: my-nginx
        image: nginx:1.14.2
        resources:
          requests:        ⭐️ request = "This is how much my application uses typically"
            cpu: 1000m        1000 "millicpus" = 1 CPU
            memory: 512Mi  
          limits:          ⭐️ limit = "Don't let the pod use more than this"
            memory: 1Gi
```

Telling Kubernetes an exact number of pods to run isn't very _auto-_scale-y, though, is it? We want more pods when we need them and fewer when we don't. We can do this by using a **Horizontal Pod Autoscaler (HPA)**, which _automatically_ increases and decreases the number of pods a deployment has.

How does the HPA know when to add or remove pods? Good question! The simplest way is for it to look at the **average CPU usage** across the pods in the deployment and when that number gets too high, add pods. When it gets too low, remove pods.

"Hey Kubernetes, run an HPA to scale the deployment we just made above. If the average CPU usage is well above 90%, bring more pods online. If it's much lower, shut some down. Also, don't let the total number of pods go below 2 or above 10."

```
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
spec:
  ⭐️ Scale up or down to keep the pods running ~90% CPU utilization
  targetCPUUtilizationPercentage: 90
  maxReplicas: 10  ⭐️ No more than 10 pods
  minReplicas: 2   ⭐️ No fewer than 2 pods
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-nginx
```

The key to optimizing our resource consumption is to run as efficiently as possible. In an ideal world, this would mean allocating exactly as much memory as needed and no more, and consuming approximately 100% of the CPU requested.

> Aha! I know what to do! I'll set `targetCPUUtilizationPercentage` to 100%, `minReplicas` to 1, `maxReplicas` to 10000, `cpu` request to 1m ("one [millicpu](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#meaning-of-cpu)" i.e. 1/1000th of a CPU) with no limit, and `memory` request to 1MB with no limit! Automatic scaling from 0 to inifinity with 100% efficiency–problem solved!

Unfortunately, It's Not That Simple...

## Why It's Not That Simple

There are a couple reasons:

### 1\. Your Containers Ultimately Run On Physical Computers With Physical Limits

The machines in a Kubernetes cluster are called "Nodes."

The `requests` you set for your containers tell Kubernetes **how much CPU/RAM your application _claims it_ needs to operate**; Kubernetes uses this information to "schedule" your container to **a node that can meet those requirements**. It finds a node with the resources available to meet your container's **requests** and starts the container in that node.

If you only request `cpu: 1m` (one millicpu) for your application and Kubernetes has a node with 1 CPU (`1000m`), Kubernetes will say "aha! This node can safely fit **one thousand** instances of your application!" When your 1000 pods start up on that node and each one actually wants `100m` rather than `1m`, that Kubernetes node will not be able to meet the pods' demands on that node. The pods will run really slowly or crash repeatedly, and Kubernetes will do nothing about it.

For this reason, it's important to tell Kubernetes roughly how much CPU & RAM your application needs so it can "set aside" an adequate amount.

### 2\. Deployments Take Time To Scale

Assume each instance of your application can serve 1000 requests per second (rps). Your traffic is steady around 10,000rps, and you have exactly 10 pods handling it, all of them running at 100% CPU (maximum efficiency, baby!!).

All of a sudden traffic increases to 15,000rps. No problem, bring another 5 pods online.

> Please wait 2-3 minutes to bring additional pods online

Two to three minutes?! Uh-oh! What are you going to do with that extra load for two to three minutes? Latency goes up, overloaded pods start to crash, and you've got an incident on your hands.

To avoid this problem, your deployments should have enough **buffer** (extra resources allocated) to handle spikes in traffic for [**two or three minutes**](https://cloud.google.com/solutions/best-practices-for-running-cost-effective-kubernetes-applications-on-gke). This means setting your HPA's target CPU utilization far enough _below_ 100% to be able to absorb spikes in traffic long enough for Kubernetes to bring more pods online.

## Identifying Overprovisioned Deployments

[The "Kubernetes Pod Cost Estimator" Grafana chart](https://grafana.gke-prod.postmates.net/d/3rsbErpWz/kubernetes-pod-cost-estimator?orgId=1&var-pod=.*&var-node_monthly_cost=1231.96&var-cpu_per_node=23&var-ram_per_node=77309411328&var-namespace=team-buyer&var-datasource=metrics%20-%20gke) is the place to start.

![](https://lh5.googleusercontent.com/Hj2PGcBW6aPzA3APimfFAaK4EREgfQbb0FcyYe122W2yDJ7H7gLnYkUjm58zmq6EVv9mnqi66xpacuFMQPUJUqQQBNoc1S4d6SInurNfVgD-fN0OlXiZXi60PzBdrzqtXWJWbEx3)

For a view of your whole namespace, set the Namespace and set the Pod Regex to `.*` (match all). To look at an individual deployment, use a Pod Regex (basically, the name of your deployment followed by `.*` e.g. `my-nginx.*`).

## What Things Can You Fiddle With to Increase Efficiency?

A brief review of what `requests` and `limits` mean:

*   `requests` = "please make sure this much schedulable RAM/CPU is available on a node before putting this pod on that node" (how much your application _typically_ uses.) This is a **target** (e.g. p50 behavior), **not a maximum**.
*   `limits` = "don't let my pod use beyond this amount, in the case of memory **immediately kill it**, in the case of CPU throttle how much time it gets on the CPU if CFS throttling is enabled otherwise do nothing" (outside max of how much your container might use or _should_ use).

For a more detailed description check out this video, especially the first half:

<div class="videodetector original youtube"><iframe allow="autoplay; encrypted-media" class="vd_frame youtube" src="//www.youtube.com/embed/xjpHggHKm78?autohide=1&amp;controls=1&amp;showinfo=0" frameborder="0"></iframe><input class="remove-videodetector short" type="button" value="Remove"></div>

With those basics out of the way, let's look at what settings you can change to Improve Your Efficiency:

### Per Container: CPU (`requests.cpu` and `limits.cpu`)

Very High Level/General Goal: looking at the [CPU panel on the cost estimator](https://grafana.gke-prod.postmates.net/d/3rsbErpWz/kubernetes-pod-cost-estimator?viewPanel=4&orgId=1&from=1603625358047&to=1603790703658&var-pod=buyer-frontend-v1-go.*&var-node_monthly_cost=1231.96&var-cpu_per_node=23&var-ram_per_node=77309411328&var-namespace=team-buyer&var-datasource=metrics%20-%20gke)  
for **a specific deployment** (set the pod regex!), ![⭐️](/emojione/assets/png/2B50.png ":star:") you want the blue line (used) to be **at or above** the green line (requested).

![](/uploaded/90126d6ba2d9af46055f8/screen_shot_2020-10-29_at_10.43.29_am.png)

> Used should be at _or above_ requested?! That doesn't make sense! How do I use more than I requested?

It's complicated but basically there's usually extra CPU and memory available on the node beyond the total amount of CPU/Memory requested. Ask the folks in #kubernetes for more info.

> Remember, **a pod is not a virtual machine** with a fixed amount of physical CPU and memory; it is a group of "containerized processes" that run on a **shared virtual machine** with other pods.

_- The folks in #kubernetes_

Anyway just **try to make the blue line sit at or above the green line**.

![💡](/emojione/assets/png/1F4A1.png ":bulb:")![💡](/emojione/assets/png/1F4A1.png ":bulb:") **Check the `targetCPUUtilizationPercentage` on the HPA before scaling down CPU!** More info in that section...

Other Rules of thumb:

1.  Don't `request` above `1` aka `"1000m"` (unless you have an application specifically designed to make use of multiple cores) [more info under "CPU"](https://cloud.google.com/blog/products/gcp/kubernetes-best-practices-resource-requests-and-limits)
2.  Don't `request` _below_ `1`: Assuming your workload is CPU bound (a single process can scale up 'til it runs out of CPU) **it probably doesn't make sense to put this below 1** CPU. Instead, consider increasing the `targetCPUUtilizationPercentage` on the HPA (see below).
3.  Set `limit` to 1.5 times whatever the `request` is (e.g. `requests.cpu: 1`;`limits.cpu: 1.5`)

### Per Container: Memory (`requests.memory` and `limits.memory`)

Memory you must be a bit careful with. If a container doesn't have quite enough CPU it may run slowly. If it requires more memory than is set in the limit **it will be killed**.

Very High Level/General Goal: looking at the [RAM panel on the cost estimator](https://grafana.gke-prod.postmates.net/d/3rsbErpWz/kubernetes-pod-cost-estimator?viewPanel=5&orgId=1&from=1603625358047&to=1603790703658&var-pod=buyer-frontend-v1-go.*&var-node_monthly_cost=1231.96&var-cpu_per_node=23&var-ram_per_node=77309411328&var-namespace=team-buyer&var-datasource=metrics%20-%20gke)  
for **a specific deployment** (set the pod regex!), ![⭐️](/emojione/assets/png/2B50.png ":star:") you want the blue line (used) to sit **at** the green line (requested). (It's OK for "used" to go over "requested" for **short periods of time** but not all the time.)

![](/uploaded/90126d6ba2d9af46055f8/screen_shot_2020-10-29_at_11.22.18_am.png)

Rules of thumb:

1.  Set `requests` at or just slightly above what you typically observe a container to use ([Pod Metrics > Memory Usage](https://grafana.gke-prod.postmates.net/d/1j4d4T9Wz/pod-metrics?viewPanel=12&orgId=1&refresh=30s&from=now-30m&to=now&var-datasource=prometheus.gke-prod.postmates.net&var-node=All&var-node_regex=.*&var-namespace=team-buyer&var-pod_regex=buyer-frontend-v1-go.*&var-pod=All&var-container=buyer-frontend-v1-go) is a good place to observe memory usage)
2.  Set `limits` _above_ the `request` value to give your pod some room to handle periods of time where it needs a bit more memory while protecting the node from any one process attempting to use all of the available memory on the node (no limit = "want to use 100% of the RAM on this node? Go ahead!" ![🔜](/emojione/assets/png/1F51C.png ":soon:") RIP other containers on that node).

### Horizontal Pod Autoscaler: Minimum Replicas

"How many pods do I need running during overnight hours?"

1.  Turn this very low so your deployment can scale down overnight to a bare minimum
2.  **Consider scale-up time!** If your application takes several minutes to start up, you should keep more pods online at minimum traffic (higher `minReplicas` value) to handle any unexpected load.
3.  Scaling below 2 is probably unwise as it leaves no redundancy at all.
4.  Minimum value should be no fewer than whatever you consider your minimum safe number of pods to run **multiplied by** the number of availability zones you're running in. We typically run in three zones here at Postmates, so if you feel safe scaling down to two pods, 2*3 = `minReplicas: 6`.

### Horizontal Pod Autoscaler: Maximum Replicas

"Beyond what point of scaling is my deployment obviously malfunctioning and running out of control?"

The `maxReplicas` setting allows you to **throttle** your deployment's horizontal scaling in order to control resource consumption. In our case here at Postmates, **we usually don't want to do this with customer-facing services**. If we run a TV ad that spikes traffic and the buyer-frontend deployment wants to jump from 250 pods up to 650, we want to let it do that. **Availability (Goal 2) is much more important than platform cost (Goal 1)** when it comes to serving customers.

For this reason, Maximum Replics should be set to whatever the highest number of pods you've observed in ([grafana chart](https://grafana.gke-prod.postmates.net/d/3rsbErpWz/kubernetes-pod-cost-estimator?viewPanel=3&orgId=1&from=1603625358047&to=1603790703658&var-pod=buyer-frontend-v1-go.*&var-node_monthly_cost=1231.96&var-cpu_per_node=23&var-ram_per_node=77309411328&var-namespace=team-buyer&var-datasource=metrics%20-%20gke)) plus 50 or 100%. Increasing this number doesn't cost us anything _directly_.  One should also take note of the resource constraints of items you connect to.  For example, if your database can only handle a maximum of 1000 connections you probably want to set your max replicas so that you do not exceed that capacity.

### Horizontal Pod Autoscaler: CPU Utilization Target

This is one of the most important settings, especially for large clusters. You want this value to be as close to 100% as possible: the "hotter" our pods run, the less idle CPU we're paying for.

_On the other hand_, if we have _no_ idle CPU, we are unlikely to be able to handle a spike in traffic (Goal 3) while waiting for the deployment to scale up.

#### Interaction between `requests.cpu` and `targetCPUUtilizationPercentage`

Earlier we said "look at CPU efficiency and reduce `requests.cpu` if you are requesting more than you're using. That advice can be misleading when you're using an HPA that scales your cluster up and down _based on average CPU utilization_.

Example: If it looks like you're only running at 70% CPU efficiency, you may think "`requests.cpu` is 30% higher than needed, I should turn it down." But if `targetCPUUtilizationPercentage` it's set to `70`, your CPU _isn't_ overprovisioned, **the deployment is just getting scaled up every time the average CPU across pods in the deployment goes much over 70%*, so the average usage always hovers around 70%!** If your pods each request 1 CPU, the deployment will scale so they each use approximately 70% of 1 CPU. If your pods each request `600m`, the deployment will scale so they each use approximately 70% of `600m`.

Turn down `requests.cpu` all you want, utilization will continue to hover at 70%. In this case, you would need to **increase `targetCPUUtilizationPercentage`**, _not_ decrease `requests.cpu` in order to increase efficiency.

* I'm not sure how much... You set it to "70" and the HPA figures out when to scale up or down to keep the average close to 70.

#### How Low Can You Go?

That's the $64 question. The formula for this is _basically_:

> 100% - (however much buffer you need to handle traffic spikes for the time it takes additional pods to come online and be ready to serve).

For more information on how to set this, see two places in [this post](https://cloud.google.com/solutions/best-practices-for-running-cost-effective-kubernetes-applications-on-gke):

1.  [The introduction to Horizontal Pod Autoscalers in this section](https://cloud.google.com/solutions/best-practices-for-running-cost-effective-kubernetes-applications-on-gke#horizontal_pod_autoscaler)
2.  The bullet point titled "Fine-tune the HPA utilization target"

As mentioned above, The interplay between `requests.cpu` and `hpa.targetCpuUtilizationPercentage` can be hard to grok, but you should make sure you consider both settings when setting either. **As a rule of thumb, increase `targetCpuUtilizationPercentage` as much as possible _before_ reducing `requests.cpu`**. It's hard to know much CPU your container _can_ make use of if it's being aggressively throttled by a low `targetCpuUtilizationPercentage`.

You'll know you've put this too low if response latency starts to climb when you get traffic spikes (or if your pods start crashing and you have an outage ![😄](/emojione/assets/png/1F604.png ":smile:")).

## Other General Tips

### Start Small!

There's no need to make big infrastructure changes all at once, and in many ways it's inadvisable! Instead of turning `targetCpuUtilizationPercentage` from 70 to 95, consider taking a stepwise approach: step it up to 80 and observe for a few days or a week, then try 90, observe a while, rinse and repeat. This is a safe and easy way to get started if you're not sure what settings are best!

## Conclusion

Hopefully these "rules of thumb" give you enough information to get started right-sizing your deployments. There is of course more fine-tuning you can do, but following these rules should get you at least 50% of the way there–there's lots of low-hanging fruit!

If you want to read more about this fascinating topic, please see the links below.

In the next post, we'll look at some additional strategies to make your cluster run more efficiently, both by optimizing your application itself and by making it more "context-aware." Stay tuned!

## Further Reading

*   [Kubernetes best practices: Resource requests and limits](https://cloud.google.com/blog/products/gcp/kubernetes-best-practices-resource-requests-and-limits): This is a great intro to the various settings you can change that goes into more detail than this post.
*   [Best practices for running cost-optimized Kubernetes applications on GKE](https://cloud.google.com/solutions/best-practices-for-running-cost-effective-kubernetes-applications-on-gke): This is a **broader** article that touches on many aspects of scaling, far beyone what I go over in this post. If this post whetted your appetite and you want to learn much more, _this is the article for you!_ ![⭐️](/emojione/assets/png/2B50.png ":star:")
*   [Reducing Docker Image Size](https://postmates-eng.blogin.co/posts/reducing-docker-image-size-110096) (the next post will explain why this is useful–read [here](https://cloud.google.com/solutions/best-practices-for-running-cost-effective-kubernetes-applications-on-gke#make_sure_your_container_is_as_lean_as_possible) if you want to know _now_)