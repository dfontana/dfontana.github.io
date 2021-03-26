+++
title = "Profiling in NodeJS with Environment Variables"
date = 2017-10-13
[taxonomies]
tags = ["js", "configuration", "environment"]
+++

While standing up a REST API for a work project, I spent a lot of time editing the IP, port, and other parameters within my server as I swapped from production and development environments. After being fed up with the constant back and forth, I searched for a better solution.<!-- more --> In this tidbit, I'm going to present my solution.

## Reading Environment Variables in Node
An easy solution would be to simply pass environment variables when launching NodeJS, pulling the configuration from inside our files to the commandline during launch time. We can accomplish this like so:

```javascript
location=Boston node server.js
```

Once we've set these variables, its a simple matter of reading them inside Node. Thankfully, Node has the `process` object, which allows us to look at environment variables through `env`. To access a variable called `location`, for example, we'd simple do:

```javascript
var location = process.env.location || 'New_York';
```

Notice we set a default value with a logical OR. It's important to remember this, to prevent undefined behavior when someone forgets to set the variable or if you have a default value in mind.

This is still not the ideal scenario, however. Let's harp on the notion of a default configuration. We've successfully pulled out our configuration using environment variables, but if I want to change the default configs then I'm back to my original problem of editing source code! Luckily, we can do one extra tweak to solve just this.

## The Magic of Profiles and JSONs
Here's where profiling comes in. What if we were to place all our configurations within a file (like a JSON) and load it in at runtime? What if we did one better, and made it a module that can handle comments AND specify all our configurations within itself - rather than specifying our default configuration within our source. Well we can! And we will:

```javascript
// config.js
let env = process.env.CONFIG || 'default';
let config = {};

/**
 * config.IP: IP of database.
 * config.PORT: Port number of database.
 * config.LOG_LEVEL: Trace level to print when logging events.
 */
switch(env){
    case('prod'):
        config.IP = '127.127.127.127';
        config.PORT = 80;
        config.LOG_LEVEL = 1;
        break;
    default:
        config.IP = '127.0.0.0';
        config.PORT = 8080;
        config.LOG_LEVEL = 2;
}

module.exports = config;
```

And then in our server.js, we:

```javascript
//Import configuration
const config = require('./config');

...

//Access it's fields
console.log(config.IP);
```

And we call our server as such:

```sh
CONFIG=prod node server.js
```

That's it! We've gone from hard coded messes, to flexible, documentable, and "gitignore-able" configurations that can change without modifying the original source.
