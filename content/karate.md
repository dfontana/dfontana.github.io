+++
title = "Integration Tests with Karate"
date = 2022-07-09
[taxonomies]
tags = ["rust", "discord", "bot", "project"]
+++

[Karate](https://github.com/karatelabs/karate) is a framework run integration or contract tests, helping deliver code with confidence holistically.<!-- more -->

(The code for this post can be found in [dfontana/karate-example](https://github.com/dfontana/karate-example))

## On Integration Tests

In my experience, "integration" varies meaning based on context. For some it's about testing multiple systems against one another; others it's a single system from a black-box perspective; and to more it's something happening at CI time. For this post, we're testing a REST API without knowing it's implementation; something closer to Contract testing. We can spin up it's dependencies (and itself) in Docker, leveraging Karate to run contract tests against the API.

Worth Noting: Alternatives exist, like [Pact](https://docs.pact.io/), [Nock](https://github.com/nock/nock), or [TestContainers](https://www.testcontainers.org/). Frameworks like [Springboot](https://docs.spring.io/spring-framework/docs/4.2.x/spring-framework-reference/html/integration-testing.html) even have this built in.

## The Problem

We have a REST API we want to verify a given input produces a given output. We have a couple dependencies: Another REST service, and a Cache.

Unit tests will help a bit, but our service is simple so they don't say much. What we really want is confidence a given input to the REST Service produces an expected output, reguardless of how the implementation is done - should we change it in the future. These tests should be runnable "anywhere" without much care of the environment (eg local, in a CI runner, etc) so we can validate at different stages of the dev cycle.

## A Solution

Docker + Karate.

Docker provides us with a consistent runner across environments. Since our API is likely in a container, or easily containerizable, it's a good candidate for running both the service itself and it's dependencies. [Docker Compose](https://docs.docker.com/compose/) can describe our service and it's dependencies. A little helper script, [wait-for-it.sh](https://github.com/vishnubob/wait-for-it), helps coordinate when to start running tests. Ephemeral docker containers will migrate our database with test data should we want to test a read-only API or prepare complex states.

[Karate](https://github.com/karatelabs/karate) is a [herbie-fully-loaded](https://en.wikipedia.org/wiki/Herbie:_Fully_Loaded) testing framework with no specific language or tool dependencies. While there's a lot we can actually do, we're only here for a few of it's features:
- [Karate-Netty](https://github.com/karatelabs/karate/tree/master/karate-netty) can mock HTTP dependencies from a specification file.
- It's can be ran from a standalone jar, no java project required
- [Schema Validation](https://github.com/karatelabs/karate#schema-validation) to Contract test; while [Assertions](https://github.com/karatelabs/karate#payload-assertions), [Data-Driven Features](https://github.com/karatelabs/karate#data-driven-features), and [Data-Driven Tests](https://github.com/karatelabs/karate#data-driven-tests) will be very useful.

## How

Let's work through an example. This will be contrived, but detailed enough to get the key points across. We need to:

1. Create a service, which use another API to "authorize" cache access
1. Create a containerized test double for this API dependency
1. Create a containerized cache instance
1. _Migrate_ the cache instance, for any seed data needed 
1. Create a Karate test to verify the shape of our response
1. Create an test-runner service, to start all dependencies and run our tests

### The Service

Will be a Rust HTTP service using [Axum](https://github.com/tokio-rs/axum). We'll connect this to a Redis cache to pull some key out of, only after getting approval from some hypothetical dependency HTTP API. Like most services, we'll keep our configuration as something supplied to the service rather than hardcoded (in this case Environment Variables, but files, command like arguments, etc could also work).

First, let's prep the project:

```bash
cargo init --bin karate-example
```

Next we will setup the following files:

{% tabs(tabs=["Cargo.toml", "src/main.rs", "docker/service/Dockerfile", "docker-compose.yml"]) %}
```toml
[dependencies]
axum = "0.5.15"
redis = "0.21.6"
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0.68"
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```
---
```rust
use axum::{
    extract::Path,
    http::{header, StatusCode},
    response::IntoResponse,
    routing::get,
    Extension, Router,
};
use redis::Commands;
use serde::Deserialize;
use std::{env, net::SocketAddr, sync::Arc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

struct AppState {
    cache: redis::Client,
    http: reqwest::Client,
    http_host: String,
}

#[tokio::main]
async fn main() {
    // Tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").expect("Must set RUST_LOG"),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Cache setup
    let cache_host = env::var("CACHE_HOST").expect("Must set CACHE_HOST");
    let cache =
        redis::Client::open(format!("redis://{}", cache_host)).expect("Failed to connect to Cache");

    // HTTP depdency client setup
    let http = reqwest::Client::new();
    let http_host = env::var("HTTP_HOST").expect("Must set HTTP_HOST");

    // State object to share between routes
    let shared_state = Arc::new(AppState {
        cache,
        http,
        http_host,
    });

    // Axum setup
    let app = Router::new()
        .route("/:key", get(root))
        .layer(Extension(shared_state));
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .expect("Failed to start HTTP Server");
}

#[derive(Deserialize)]
struct CanDoResponse {
    can_do: bool,
}

async fn root(state: Extension<Arc<AppState>>, Path(key): Path<String>) -> impl IntoResponse {
    //Hit HTTP dependency to determine if we can continue
    let res = state
        .http
        .get(format!("http://{}/can-do/{}", state.http_host, key))
        .send()
        .await;
    let can_do = match res {
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", e))),
        Ok(v) => v.json::<CanDoResponse>().await.unwrap().can_do,
    };
    if !can_do {
        return Err((StatusCode::UNAUTHORIZED, "Unauthorized for Resource".into()));
    }

    // Assuming we can, hit the cache dependency
    state
        .cache
        .get_connection()
        .and_then(|mut c| c.get("myTest"))
        .map(|v: i64| {
            (
                StatusCode::OK,
                [(header::CONTENT_TYPE, "application/json")],
                format!("{}", v),
            )
        })
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", e)))
}
```
---
```Dockerfile
### Dependecy Cache Image ###
#############################
FROM rust:latest AS cache
RUN update-ca-certificates
WORKDIR /
RUN USER=root cargo new --bin karate-example
WORKDIR /karate-example
COPY ./Cargo.* .
RUN cargo build --release


### Build Image ###
###################
FROM cache AS builder

ENV USER=karate
ENV UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}"


WORKDIR /karate-example
RUN rm src/*.rs
ADD . ./
RUN rm ./target/release/deps/karate_example*
RUN cargo build --release

### Final Image ###
###################

FROM gcr.io/distroless/cc
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group
WORKDIR /karate-example
COPY --from=builder /karate-example/target/release/karate-example ./

USER karate:karate
CMD ["/karate-example/karate-example"]
```
---
```yaml
version: '3.9'
services:
  service:
    build:
      context: .
      dockerfile: docker/service/Dockerfile
    environment:
      CACHE_HOST: cache:6379
      HTTP_HOST: http-mock:8181
      RUST_LOG: info
    ports:
      - '8080:8080'
```

{% end %}


{% callout(type="note", title="Addressing slow docker builds", collapse=true) %}
You may also want to create a `.dockerignore` to skip over excess files in the docker build, so less items are sent to the docker runtime during build. This can address slowdowns
```
debug/
target/
```
{% end %}


At this point we have a service that will attempt to start, without a cache service it will fail to boot:

```bash
docker compose up service
```

### The Cache Instance

Redis provides a docker image we can conveniently use to start up an instance of our cache, like so:

```yaml
services:
  # ...
  cache:
    image: redis:7.0.4
    ports:
      - '6379:6379'
```

If we update our `docker-compose.yml` to point our Service to this cache instance (via Environment Variables), the service will now boot without a connection failure. But requesting it still emits a `500` due to the missing HTTP dependency:

```bash
$ curl localhost:8080/myTest
reqwest::Error { kind: Request, url: Url { scheme: "http", cannot_be_a_base: false, username: "", password: None, host: Some(Domain("http-mock")), port: Some(5000), path: "/can-do/myTest", query: None, fragment: None }, source: hyper::Error(Connect, ConnectError("dns error", Custom { kind: Uncategorized, error: "failed to lookup address information: Name or service not known" })) }%  
``` 

### The HTTP Test Double

To mock the HTTP dependency, we'll use Karate Netty - albeit alternatives such as [httpmock](https://github.com/alexliesenfeld/httpmock) exist. In short, this requires a specification which will match path rules with responses. There's ways to get more complex than that, but we'll keep it simple. This looks very much like a Karate test, living inside a "feature" file - all of which can be bundled into it's own image, making it easy to boot:

{% tabs(tabs=["docker/http/mocks/MockFeature.feature","docker/http/Dockerfile","docker-compose.yml"]) %}
```gherkin
Feature: Dependency Mock
  Background:
    * def outs = 
    """
    {
      "myTest": true
    }
    """

  Scenario: pathMatches('/can-do/{id}') && methodIs('get')
    * def responseStatus = 200
    * def response = {}
    * response.can_do = outs[pathParams.id] || false
```
---
```Dockerfile
FROM debian:buster-slim as builder
RUN apt-get update && apt-get install -y curl
WORKDIR /
RUN curl -L -H "Accept: application/zip" https://github.com/karatelabs/karate/releases/download/v1.2.1.RC1/karate-1.2.1.RC1.jar -o karate.jar 

FROM eclipse-temurin:11
RUN mkdir /app
COPY --from=builder /karate.jar /app
CMD [\
  "java", "-jar", "/app/karate.jar",\
  "-p", "8181",\
  "-m", "/app/mocks/MockFeature.feature"\
]
```
---
```yaml
services:
  http-mock:
    build:
      context: .
      dockerfile: docker/http/Dockerfile
    ports:
      - 8181:8181
    volumes:
      - ./docker/http/mocks:/app/mocks
```
{% end %}

Again updating the Axum Service's Environment variables, we can boot the service and fetch the `myTest` key once more. We now get past the 500 error and are allowed to hit the cache, but are met with a 404 since our cache is empty.

#### Creating Test Data

Ephemeral docker containers are short lived containers meant to perform a task and discard themselves. There's nothing special to them outside of this property. In this case, we want something that will poll Redis until it's ready to accept data, run a bunch of inserts, and then shut itself down. Making our Service dependent on this (and this dependent on Redis) will ensure our cache is hydrated.

I've opted to use the bulk loading approach to issue commands from a `.txt` file but you could be more creative and use something like a Python or Lua script connecting to the instance.

First we can define our `.txt` file for seeding data:

`docker/cache-migrate/migrate.txt`
```sql
SET myTest 200
```

Then using [wait-for-it.sh](https://github.com/vishnubob/wait-for-it) we can wait for Redis in our image's entrypoint, then run the `migrate.txt`. Notice I'm baking the seed `.txt` into the image itself rather than relying on a mount; while this does mean the image has to be rebuilt when this `.txt` changes, it does make it a little easier to pass the seed data between machines (eg a CI server, etc). You could choose to go with a volume mount approach, just remember you'll need to have the seed scripts copied to your test environment!

`docker/cache-migrate/Dockerfile`
```Dockerfile
FROM debian:buster-slim as builder
RUN apt-get update && apt-get install -y git
WORKDIR /
RUN git clone https://github.com/vishnubob/wait-for-it.git

FROM redis:7.0.4
COPY --from=builder /wait-for-it/wait-for-it.sh /app/wait-for-it.sh
COPY /docker/cache-migrate/migrate.txt /etc/migrate.txt

ENTRYPOINT [\
  "/app/wait-for-it.sh", "cache:6379", "-s",\
  "--", "sh", "-c", "cat /etc/migrate.txt | redis-cli -h cache --pipe"\
]
```

{% callout(type="note", title="Waiting for a Port won't Work" collapse=true) %}

Some databases open their ports before the application is fully ready for connections. In these cases, you'll likely need to copy `wait-for-it.sh` and modify it (or do something similar to it) such that the script blocks until the dependency is running or times out. Many times this might mean using a native tool your dependency provides, or some other "ready check" style probe.

{% end %}

In our `docker-compose.yml` we'll then define this like so:

```yaml
services:
  # ...
  migrate-cache:
    build:
      context: .
      dockerfile: docker/cache-migrate/Dockerfile
    depends_on:
      - cache
```

Now if we hit the local service, we find a fully formed response based on our test data:
```bash
$ curl localhost:8080/myTest
200
```

### Karate Tests

Karate tests are defined in so called "feature" files, which use a Syntax similar to [Cucumber](https://cucumber.io/). The Karate documentation describes the syntax well - the high level idea to describe an HTTP request and then assert on the response. In this test, we'll verify I can fetch a key I'm authorized for, as well as one I am not:

```gherkin
Feature: Verify Authorization
  Background:
    * url baseUrl

  Scenario: Can request myTest
    Given path 'myTest'
    When method GET
    Then status 200
    And match response == '200'

  Scenario: Cant request notMyTest
    Given path 'notMyTest'
    When method GET
    Then status 401
```

We can define all our tests in a specific directory(s) and Karate will run all of them recursively, making it simple to add new tests/cases without needing to adjust our test harness. 

### Making the Test Runner Service

Finally we need a test runner container to bootstrap everything: Boot services, migrations, and execute tests. Depending on environment, we can create alternate versions for CI runners versus local runners, to configure Ports, Volumes, and Variables differently. Like the migrations, our test cases are baked into this image for portability. This would look like:

{% tabs(tabs=[`docker-compose.yml`,`docker/karate/entrypoint.sh`,`docker/karate/Dockerfile`,`docker/karate/karate-config.js`]) %}
```yaml
services:
  # ...
  karate:
    build:
      context: .
      dockerfile: docker/karate/Dockerfile
    working_dir: /workdir
    entrypoint: /bin/bash
    command: docker/karate/entrypoint.sh
    volumes:
      - .:/workdir
    depends_on:
      - service
```
---
```bash
#!/bin/bash
/app/wait-for-it service:8080 -t 30
echo "Running tests!"
java -jar -Dkarate.config.dir="docker/karate" /app/karate.jar docker/karate/features -e docker -o /app/target --tags ~@ignore
```
---
```Dockerfile
FROM debian:buster-slim as builder
RUN apt-get update && apt-get install -y git curl
WORKDIR /
RUN git clone https://github.com/vishnubob/wait-for-it.git
RUN curl -L -H "Accept: application/zip" https://github.com/karatelabs/karate/releases/download/v1.2.1.RC1/karate-1.2.1.RC1.jar -o karate.jar 

FROM eclipse-temurin:11
RUN mkdir /app
COPY --from=builder /wait-for-it/wait-for-it.sh /app/wait-for-it.sh
COPY --from=builder /karate.jar /app

CMD [\
  "/app/wait-for-it.sh", "service:8080", "-s", "-t", "30", "&&",\
  "echo", "'Running tests!'", "&&",\
  "java", "-jar", "-Dkarate.config.dir=\"docker/karate\"", "/app/karate.jar", "docker/karate/features", "-e", "docker", "-o", "/app/target", "--tags", "~@ignore"\
]
```
---
```js
function fn() {   
  var env = karate.env; // get java system property 'karate.env'
  karate.log('karate.env system property was:', env);
  // Can optionally change this config based on the ENV if you need to invoke a different
  // URL based on running in a test environment vs a docker environment, etc
  return {
    baseUrl: 'http://service:8080/'
  }
}
```
{% end %}

## End to End

We can happily close out by demonstrating that if we run our karate service, we can see all tests are reporting as passing after having started up all dependencies and executed the cases:

```bash
docker compose run --rm karate
# Truncated

22:41:46.667 [main]  INFO  com.intuit.karate.Suite - <<pass>> feature 1 of 1 (0 remaining) docker/karate/features/Example.feature
Karate version: 1.2.1.RC1
======================================================
elapsed:   1.18 | threads:    1 | thread time: 0.35 
features:     1 | skipped:    0 | efficiency: 0.30
scenarios:    2 | passed:     2 | failed: 0
======================================================
```
