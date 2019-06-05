---
title: "Avoiding Ticket Scope Creep While Improving Code"
date: 2019-06-05
description: "We all want to \"improve as we go\" when writing code, but how do we do this while also getting the feature development task at hand done and keeping our PRs small?"
---

"Leave code better than you found it," the idea that one should make minor improvements and refactors in the course of feature development rather than leave improvements for later, is an important strategy for staying on top of technical debt & keeping your code clean. There is such a thing as “too much of a good thing,” however!

In the course of developing a feature, you might notice a library that needs upgrading, which requires some minor refactors, some repeated code to extract into functions, a small change that could result in a performance improvement, and a dozen other issues. If you attempt to address them all in the moment, two things will happen:

1. The feature you were working on will take a week or more to finish rather than the "one or two days" you estimated
2. Your pull request will become enormous, making review arduous and time-consuming, further delaying feature delivery (and likely frustrating the reviewer!)

The following strategies can help you stay on track with the task at hand and keep your pull requests manageable while ensuring you don't lose track of the issues you uncovered in the course of development.

## “To Do Later” List

Upon starting a task, make a list for “To Do Later” actions. When, in the course of working on Issue-A, you come across something that should be improved but a) will take time and b) is not necessary to complete Issue-A, put this item on the “To Do Later” list.

After completing Issue-A, go over your “To Do Later” items and do them (small items) or create tickets for them (larger items), as appropriate. Noting items for later allows you to stay focused on your current task without losing track of the improvement you’d like to make.

_This idea was adapted from the “[Parking Lot](https://www.lucidmeetings.com/glossary/parking-lot)” concept for meetings._

## Improvements Budget

Upon starting a coding task (“Issue-A”), make a numbered “Improvements” list (1,2,3) for code improvements. When you find a small issue you’d like to address (outside the ticket scope), fix it, and add it to the “Improvements” list as item one. Do this again for the second and third small issues you fix, then **stop**.

Once you’ve made three small improvements, **your “Improvement Budget” has been spent**, and no more out-of-scope improvements should be worked on as part of Issue-A. Any additional out-of-scope issues must be put on the “To Do Later” list.

This strategy is a compromise between “focus only on the issue at hand and don’t improve anything” and “fix everything issue you find, as you find it, even if this means Issue-A takes weeks to complete rather than days.” The “budget” can of course be adjusted to a number of items besides 3.

_This idea was inspired by the [Most Important Tasks strategy](https://zenhabits.net/purpose-your-day-most-important-task/), which also has the concept of a budget of three items._

## What Else?

Do you use these strategies, and if so are they useful to you? Do you have other strategies to balance code improvement and feature delivery? If so please let me know in the comment box below. Happy coding!