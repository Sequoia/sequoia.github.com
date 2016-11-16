---
title: "Migrating a Legacy System to a Modern API Framework"
date: March 3, 2016
description: "LoopBack makes it easy to develop greenfield APIs, but in real business environments, data isn’t always tidy & cooperative. In this case study we'll see what it takes to migrate a complex legacy application to LoopBack."
originalUrl: "https://strongloop.com/strongblog/migrating-a-legacy-system-to-loopback-even-with-complicated-data/"
originalBlog: "StrongBlog"
---

We know LoopBack [makes it a breeze](https://strongloop.com/strongblog/compare-express-restify-hapi-loopback/) to create APIs that expose [SQL](https://strongloop.com/strongblog/getting-started-with-the-mysql-connector-for-loopback/) & [NoSQL](https://strongloop.com/strongblog/node-js-loopback-js-couchbase-connector/) databases ([among others](https://strongloop.com/strongblog/node-js-loopback-api-gateway-sample-applications/)), but in real business environments, data isn’t always this tidy. As business systems develop over years, it’s not uncommon for information to be scattered across databases, flat files, or even third party servers outside of your control. Given a complex situation like this, is it still possible to build an API using LoopBack? Yes it is, and that’s just what we’ll do now!

## Background

Al’s Appliances is a retail chain that specializes in ACME products. Al’s has a website where customers can order products, but getting replacement parts for products is more complicated.

To wit:

1. Customer calls Sales Rep with **product name**.
2. Sales Rep looks up **product number** in the products database.
3. Sales Rep uses **product number** to find the proper **parts list**, supplied by ACME.
4. Customer asks about one or more **parts**.
5. Sales Rep goes to ACME’s wholesaler portal and looks up **price** and **availability** of the parts, one by one.

Yikes! Al’s IT team would like to build an interface to support the following workflow:

1. Customer looks up product on website.
2. Customer clicks to see list of associated parts with up-to-date price and availability info.
3. Alternately, Customer can enter a part number and get up-to-date info for that part.

Their team can build the web UI, but it’s up to us to tie the data together & expose it via an API.

## Lay of the Land

We have the following assets to work with:

1. **Products Database**: a SQL database with a Product table listing name, description, and ID of each product.
2. **Parts lists ([CSVs](https://en.wikipedia.org/wiki/Comma-separated_values#Example))**: ACME delivers CSV files, named by product number & containing a list of part names & [SKUs](https://en.wikipedia.org/wiki/Stock_keeping_unit). For example:

   ```nohighlight
   //mvwave_0332.csv//
   door handle,8c218
   rotator base,f74af
   rotator axel,15b4c
   ...,...
   ```
   These CSVs are the “single source of truth” for parts info and they’re sometimes updated or replaced. Business processes for other departments rely on them, so unfortunately we must do the same (we must use the CSVs, moving the data to a database is not an option).

3. **Parts API**: We’re in luck: ACME exposes a rudimentary API to access part information, so we don’t have to [scrape the website!](https://en.wikipedia.org/wiki/Web_scraping) Unfortunately, it’s very simple and only exposes one endpoint to look up a single part at a time:

   ```js
   //GET api.acme.com/parts/f74af
   {
     "name": "rotator base",
     "sku": "f74af",
     "qty_avail": 0,
     "price": "2.32"
   }
   ```
   
IT has requested an API that exposes the following endpoints:

1. `/v1/products` → Array of products
2. `/v1/products/{id}` → Object representing a single product
3. `/v1/products/{id}/parts` → Array of parts for a product
4. `/v1/parts/{sku}` → Object representing a single part

# Why LoopBack?

Given this nonstandard, somewhat complicated data architecture, why not build a 100% custom solution instead of using LoopBack, which best shows its strengths with more structured data? Using LoopBack here will require us to go “off the beaten path” a bit, but in return we get…

* easy extension of our application with any of the components in the LoopBack ecosystem
* API discovery and exploration tools
* powerful configuration management
* loose coupling to the current data sources

That last point is important, as it will allow us to eventually replace the directory of CSVs with a database table, once the business is ready for this, without major rewrites. Plugging into the LoopBack ecosystem gives us access to ready solutions for auth, data transformation, logging, push notification, throttling etc. when our requirements grow or change. Broadly speaking we’ll be building a highly extensible, highly maintainable application that can serve as a foundation for future projects, and this is makes LoopBack a good choice.

Setting Up
To get started we’ll install [Strongloop tools](https://www.npmjs.com/package/strongloop)

```nohighlight
$ npm install -g strongloop
```

and [scaffold a new LoopBack application](https://docs.strongloop.com/display/public/LB/Application+generator) in a new directory.

```nohighlight
$ slc loopback als-api
```

Now we can switch to the new `als-api` directory and generate our models. We’ll keep them server-only for now, we can easily change that later.

```nohighlight
$ cd als-api
$ slc loopback:model
? Enter the model name: Product
? Select the data-source to attach Product to: db (memory)
? Select model's base class PersistedModel
? Expose Product via the REST API? Yes
? Custom plural form (used to build REST URL): n
? Common model or server only? server
```

Let’s add some Product properties now.

```nohighlight
? Property name: name
invoke loopback:property
? Property type: string
? Required? Yes

...etc...
```

*NB: You can see a detailed example of this process [here](https://docs.strongloop.com/display/public/LB/Create+new+models).*

Once we finish this process, we have models for Product, Part, and PartsList, with corresponding `js` and `json` files in `server/models/`. The PartsList is a join model that connects a Product to its Parts. That model requires some custom code, so we’ll save that bit for last and start by wiring the Product and Part model to their datasources.

## Product

Our generated `server/models/product.json`:

```js
{
  "name": "Product",
  "properties": {
    "name": {
      "type": "string",
      "required": true
    }
  },
  "description": {
    "type": "string",
    "required": true
  },
  "id": {
    "type": "string",
    "required": true
  }
 },
. . .
}
```

The products are in a SQL database (SQLite for our example). There are three steps to connecting the model to its data:

1. **Install the appropriate connector.** Loopback has many data connectors but only the “in memory” database is bundled. The [list of StrongLoop supported connectors](https://docs.strongloop.com/display/public/LB/Database+connectors) doesn’t include SQLLite, but the [list of community connectors](https://docs.strongloop.com/display/public/LB/Community+connectors) indicates that we should install “loopback-connector-sqlite”:

   ```nohighlight
   $ npm install --save loopback-connector-sqlite
   ```
2. **Create a datasource using that connector.** To create a sqlite datasource called “products,” we add the following to server/datasources.json:

   ```js
   "products": {
     "name": "products",
     "connector": "sqlite",
     "file_name": "./localdbdata/
     local_database.sqlite3",
     "debug": true
   }
   ```
   In our local setup our sqlite database resides in ./localdbdata/ we can later add another configuration for the production environment.

3. **Connect the model to the datasource.**
   `/server/modelconfig.json` manages this:

   ```js
   "Product": {
     "dataSource": "products",
     "public": true
   },
   ```
   There is an additional step for this particular connector, specifying which field is the primary key. We do this by adding `"id": true` to a property in `/server/models/product.json`:

   ```js
   . . .
   "properties": {
     . . .
     "id": {
       "type": "string",
       "id": true,
       "required": true
     }
   },
   . . .
   ```

Before we start our server to see if this works, let’s update the server configuration to expose the API on `/v1/` rather than the default path (`/api/`) in `server/config.json`:

```js
. . .
  "restApiRoot": "/v1",
  "host": "0.0.0.0",
. . .
```

The API will now be served from `/v1/` per IT’s specifications. Now we can start our server…

```nohighlight
$ npm start
```

and start querying products from <http://localhost:3000/>

```js
//GET /v1/products
[
  {
    "name": "Microwelle Deluxe",
    "description": "The very best microwave money can buy",
    "id": null
  },
  {
    "name": "Microwelle Budget",
    "description": "The most OK microwave money can buy",
    "id": null
  },
. . .
]
```

Uhoh! The `ids` are strings and `idInjection` makes LoopBack treat them as numbers. Let’s fix that in `server/models/product.json`:


```js
. . .
  "idInjection": false,
. . .
```

Now let’s try again:

```js
//GET /v1/products
[
  {
    "name": "Microwelle Deluxe",
    "description": "The very best microwave money can buy",
    "id": "microwelle_010"
  },
  {
    "name": "Microwelle Budget",
    "description": "The most OK microwave money can buy",
    "id": "microwelle_022"
  },
. . .
]
 
//GET /v1/products/microwelle_010
{
  "name": "Microwelle Deluxe",
  "description": "The very best microwave money can buy",
  "id": "microwelle_010"
}
```

That’s better! Our Products are now being served so Endpoints 1 (`/v1/products`) and 2 (`/v1/products/{id}`) are working. Now let’s configure our Parts datasource and set up Endpoint 4 (`/v1/parts/{sku}`).

Part
Our generated `server/models/part.json`:

```js
{
  "name": "Part",
  "properties": {
    "sku": {
      "type": "string",
      "required": true
    },
    "qty_avail": {
      "type": "number",
      "required": true
    },
    "price": {
      "type": "number",
      "required": true
    },
    "name": {
      "type": "string",
      "required": true
    }
  }
. . .
}
```

We’ll need to follow the same three steps to connect the Parts model its datasource, a remote server this time.

1. **Install connector**:

   ```nohighlight
   $ npm install --save loopback-connector-rest
   ```

2. **Create Datasource**: Because there’s no universal standard for what parameters REST endpoints take, how they take them (query, post data, or part of URL), or what sort of data they return, we must configure each method manually for a REST datasource.

   ```js
   //server/datasources.json:
   . . .
     "partsServer": {
       "name": "partsServer",
       "connector": "rest"
       "operations": [{
         "template": {
           "method": "GET",
           "url": "http://api.acme.com/parts/{sku}",
           "headers": {
             "accepts": "application/json",
             "contenttype": "application/json"
           }
         },
         "functions": {
           "findById": ["sku"]
         }
       }]
     }
   . . .
   ```
   This will create a method called `findById` on any model attached to this datasource. That method takes one parameter (sku) that will be plugged into the url template. Everything else here is default.

   We named the “operation” findById to conform to LoopBack convention. Because it has this name, LoopBack will know to exposed the method on /v1/parts/{id} .

3. **Connect the model to the datasource.** `/server/modelconfig.json`:

   ```js
   . . .
     "Part": {
       "dataSource": "partsServer",
       "public": true
     },
   . . .
   ```

Let’s restart the server and try it out:

```js
//GET /v1/parts/f74af
{
  "name": "rotator base",
  "sku": "f74af",
  "qty_avail": 0,
  "price": "2.11"
}
```

Endpoint 4 (`/v1/parts/{sku}`) is now working! It’s just a passthrough to the ACME API right now, but this has advantages: we can set up logging, caching, etc., we don’t have to worry about [CORS](https://remysharp.com/2011/04/21/getting-cors-working), and if ACME makes a breaking API change, we can fix it in one place in our server code and clients are none the wiser.

With the easy parts out of the way, it’s time to tackle our CSVs…

## PartsList

Although the part lists CSVs contain product names, we’re relying on the remote server for this, so the CSVs are being used as simple many-to-many
join tables. Many-to-many tables don’t generally need their own model, so why are we creating one in this case? There are two reasons:

1. Rather than a normal join table filled with `product_id`, `sku` pairs, we have a bunch of files named like `{product_id}.csv` that contain lists of `sku`s. This will require custom join logic, and,
2. We want to encapsulate this logic in one place so the Product and Part models are not polluted with CSV and file-reading concerns.

If we stop using CSVs in the future we can delete this model and update the relationship configurations on Product, and that model can continue working without changes.

We’re going to use a [hasManyThrough](https://docs.strongloop.com/display/public/LB/HasManyThrough+relations) relationship to tie Products to their Parts, and because we’re not concerned with the part name in the PartsList, our `partslist.json` is does not specify any properties:

```js
{
  "name": "PartsList",
  "base": "PersistedModel",
  "properties": {
  },
. . .
}
```

We’re not exposing PartsLists directly via the API, just using them for Endpoint 3 (`/v1/products/{id}/parts`), so we’ll just set it up to support this relationship. This first step here is to add the relationship from Product to Part, which we can do using the relationship generator:

```nohighlight
$ slc loopback:relation
? Select the model to create the relationship from: Product
? Relation type: has many
? Choose a model to create a relationship with: Part
? Enter the property name for the relation: parts
? Optionally enter a custom foreign key:
? Require a through model? Yes
? Choose a through model: PartsList
```

Now when we hit `/v1/products/thing_123/parts`, LoopBack will attempt to figure out what Parts are related to our Product by calling `find` on the join model, more or less like this:

```js
PartsList.find(
  {
    where: { productId: 'thing_123' },
    include: 'part',
    collect: 'part'
  },
  {},
  function callback(err, res){ /*...*/ }
);
```

How will we make this work? We’ll definitely need to read CSVs from the filesystem, so let’s get that configuration out of the way.

##Configuration

Our PartsList CSVs exist in `/vol/NAS_2/shared/parts_lists` but of course we don’t wish to hardcode this path in our model. Instead, we’ll put it into a local config file where it can easily be overridden in other environments:

```js
//server/config.local.json:
{
  'partsListFilePath' : '/vol/NAS_2/shared/parts_lists'
}
```

## Overriding `PartsList.find`

We know that when querying related models, LoopBack will call `find` on the “through” model (aka join model), so we’ll override `PartsList.find` and make it:

1. read `thing_123.csv`
2. get the `sku`s
3. call Part`.findOne` on each sku
4. pass an array of Parts to the callback

We’ll need to override the method in `server/models/partslist.js`. To override a data access method like this, we listen for the `attached` event to fire then overwrite the method on the model. We’ll be using two node modules to help: [async](https://www.npmjs.com/package/async) to manage “wait for multiple async calls (calls to ACME API) to finish then call our `done` callback with the results,” and [csvparse](https://www.npmjs.com/package/csv-parse) to parse our CSVs:

```js
//server/model/partslist.js:
var fs = require('fs');
var async = require('async');      //npm install!
var csvParse = require('csvparse');//npm install!
var path = require('path');
 
module.exports = function(PartsList) {
  PartsList.on('attached', function(app){
 
    PartsList.find = function(){
      //variable arguments, filter always first callback always last
      var filter = arguments[0];
      var done = arguments[arguments.length-1];
 
      //0. build the filename
      var filename = filter.where.productId + '.csv';
      var csvPath = path.join(app.get('partsListFilePath'),
filename);
      //1. read the csv
      fs.readFile(csvPath, 'utf-8', function getParts(err, res){
        if(err) return done(err);
 
        //parse the csv contents
        csvParse(res, function(err, partlist){
          if(err) return done(err);
          
          //2. get the skus from ['part name', 'sku'] tuples
          var skus = partlist.map(function getSku(partTuple){
            return partTuple[1];
          });
 
          //3. call Part.findOne on each sku
          async.map(skus, app.models.Part.findById, function (err,
parts){
            if(err) return done(err);
 
            //4. pass an array of Parts to the callback
            done(null, parts);
          });
        });
      });
    };
  });
};
```

This could certainly be broken up into named functions for easier reading, but it works and for our purposes that’s good enough! One issue, however, is that the repeated calls to `Part.findById` is a “code smell:” we have Part logic (get all Parts by list of `sku`s) in the PartsList model. It would be much better to pass our array of `sku`s to a Part method and let it handle the details. Let’s change step (3) above so it looks like this:

```js
//3. pass our list of SKUs and `done` callback to Part.getAll
app.models.Part.getAll(skus, done);
 
//4. pass an array of Parts to the callback
//   ^-- this happens in Part.getAll
```

Now we add this new method to Part:

```js
//server/model/part.js:
var async = require('async');
 
module.exports = function(Part) {
  Part.getAll = function(skus, cb) {
    async.map(skus, Part.findById, function (err, parts){
      if(err) return cb(err);
      cb(null, parts);
    });
  }
};
```

Now our Parts logic is nicely encapsulated in the Part model & the logic in our PartsList model is a bit simpler. Let’s give our last API endpoint a try:

```js
//GET /v1/Products/mvwave_0332/parts
[
  {
    "name": "door handle",
    "sku": "8c218",
    "qty_avail": 0,
    "price": "1.22"
  },
  {
    "name": "rotator base",
    "sku": "f74af",
    "qty_avail": 0,
    "price": "8.35"
  },
  {
    "name": "rotator axel",
    "sku": "15b4c",
    "qty_avail": 0,
    "price": "2.32"
  }
]
```

It works!

## Next Steps

We managed to tie together a motley collection of data sources, represent them with LoopBack models, and expose them on an API built to IT’s specifications. That’s a good stopping point for now. Obvious next steps would be to [disable unused methods](https://docs.strongloop.com/display/public/LB/Exposing+models+over+REST#ExposingmodelsoverREST-HidingmethodsandRESTendpoints) (this API is read-only, after all), build a client to interact with our API, and to [set up auth](https://docs.strongloop.com/display/public/LB/Authentication%2C+authorization%2C+and+permissions) if needed. By using LoopBack to build our API, we’ve positioned ourselves to be able to complete these tasks easily. We can now answer my initial question with greater confidence: yes, LoopBack can do it!

Want to see all this stuff actually work? Check out the [demo app](https://github.com/Sequoia/loopback-legacy-migration-example)!