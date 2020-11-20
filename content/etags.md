+++
title = "Storing Data with ETags (in Go)"
date = 2019-01-01
description = "Yet, what if there were no cookies? Be it paranoid users clearing their browsing data, increasingly stringent cookie policies, or lack of cookie persistence (see _WebView_) we could realistically find ourselves here. As a result, we'll need a new way to persist some data, one of which I'd like to demonstrate today: **ETags**."
[taxonomies]
tags = ["go", "etag", "http"]
categories = ["code"]
+++

What if there were no cookies? Be it paranoid users clearing their browsing data, increasingly stringent cookie policies, or lack of cookie persistence (see _WebView_) we could realistically find ourselves here. As a result, we'll need a new way to persist some data, one of which I'd like to demonstrate today: **ETags**.<!-- more -->

When a server needs to keep some information client side, Cookies typically get leveraged to save that little snippet. Our data gets set in a Cookie, the lifetime of the Cookie is set, and the Cookie is persisted until our next encounter when the server needs it. On that next visit, we'd load up the cookie and continue; "Business As Usual." While this data shouldn't be considered _guaranteed_, developers could treat it as somewhat _reliable_ (present?) since the average user really doesn't touch their cookies. In other words, _"if the user has been to my site before, I probably still have my cookie data"_.

## Primer & Control: Using Cookies

Before we dive into an ETag example, however, we should first remind ourselves what a cookie interaction might look like (in this case, Go).

```go
import "net/http"

func handler(w http.ResponseWriter, req *http.Request) {
  // Getting a cookie
  cookie, err := req.Cookie("cookiename")
  if err != nil {
    // Setting a cookie
      cookie = &http.Cookie{
        Name:  "cookiename",
        Value: "random_id",
      }
      http.SetCookie(w, cookie)
  }
  // ...
}
```

Fairly straightforward, our Cookie `cookiename` is requested. Should the server not obtain it, we'll generate a new Cookie for the client to save which will contain a singular value `random_id`. After which, we'll be safe to use our data as-per-usual.

Some properties of this transaction we should keep in mind for our ETag discussion:

1. Cookies are available only when the browser supports it & the user allows it. The aforementioned _WebViews_ found on Android and IOS devices (typically making a presence when an App embeds web data or opens a webpage outside the native browser) do not support persistent cookies - only session.
2. Cookies are explicitly stored, serving as a Key-Value store that the browser exposes. That may seem like a very obvious assertion, but in a moment we'll see why it's important to remember.
3. Cookies have a lifetime; if not set, they persist only for the active session (akin to browser process running-_ish_, after considering session restoration).

## An Example with ETags

ETags, on the other hand, are supported by all major browsers and [WebView](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag#Browser_compatibility). They are not, however, a traditional Key-Value store. Instead ETags are a way to intelligently manage a cached resource, preventing the need to request a new copy of it if the version (specified by the ETag) is unchanged. That is the key mechanism to be exploited: If the browser sends us the ETag each time it requests our page, then we'll know a specific value tied to that client's _cache_.

Specifically, we need to set the `Etag` Header to the value we want and `Cache-Control` to `private, must-revalidate` signaling that our cache should be unshared and that the browser _must_ send us the `If-None-Match` header whenever requesting the item related to this cache. When obtaining the item once more, we'll be looking at this `If-None-Match`, as that is what the browser is asking us to compare against - what it doesn't know is we'll never tell it there is a match.

```go
const (
	ETAG_SET      = "Etag"
	ETAG_GET      = "If-None-Match"
	CACHE_CONTROL = "Cache-Control"
)

// ...
http.HandleFunc("/etag", func(w http.ResponseWriter, r *http.Request) {
  // Get the ETag
  etag := r.Header.Get(ETAG_GET)
  if etag == "" {
    etag = uuid()
  }

  // Use the ETag

  // Respond, restoring the ETag
  w.Header().Set(CACHE_CONTROL, "private, must-revalidate")
  w.Header().Set(ETAG_SET, etag)
})

// ...
```

([_See full source below_](#full-source-example))

This approach differs from our cookie example in a few meaningful ways:

1. This is not a Key-Value store; rather it lets us store a single identifier that IDs the client.To that extent we're able to accomplish much more; we could store that client specific data server side if we wanted to, tying it to this ID!
2. We always need to reset the ETag when sending a response. Since we don't want the browser to draw our true response from cache, we'll set the ETag header again when setting the response. This will have the browser cache with the ETag value, even if it is the same as before.
3. ETags are tied to the resource requested, meaning we get one ETag per URI the browser requests. Depending on our application's function, this may impact the overall architecture.

## Closing Thoughts

ETags can help replace the need for Cookies if we'd like. If our data is small enough and in a valid ETag format, we could just save all our data as the ETag itself. More likely than not, however, we would not meet these constraints. In that case, we could get more creative - we could use the ETag to store a reference identifier, to which we relate our client-specific data server-side. There comes the pros and cons of storing this data, but this could prove to be an interesting enhancement for some use cases.

Regardless, it's important to remember one thing: ETags were not meant to be a form of data storage. They're a cache management tool that happens to allow snippets of data to persist. If your definition of "hack" is to "use a system in a way it was not designed for," then this article boils down to a _hack_.

## Full Source Example:

**main.go**

```go
package main

import (
	"crypto/rand"
	"fmt"
	"html/template"
	"net/http"
)

const (
	ETAG_SET      = "Etag"
	ETAG_GET      = "If-None-Match"
	CACHE_CONTROL = "Cache-Control"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 1. If we have an etag use it, else make a new one
		etag := r.Header.Get(ETAG_GET)
		if etag == "" {
			etag = uuid()
		}

		// 2. Do other things with it

		// 3. Respond, setting it again
		w.Header().Set(CACHE_CONTROL, "private, must-revalidate, proxy-revalidate")
		w.Header().Set(ETAG_SET, etag)
		p := struct{ Tag string }{etag}
		t, _ := template.ParseFiles("template.html")
		t.Execute(w, p)
	})

	http.ListenAndServe(":3000", nil)
}

func uuid() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		fmt.Println("Error: ", err)
		return ""
	}

	return fmt.Sprintf("%X", b)
}
```

**template.html**

```html
<h1>Your Etag {{.Tag}}</h1>
```
