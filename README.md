# Sycamore

In its simplest form, Sycamore is a wrapper around [jQuery](http://jquery.com)'s `$.ajax` that provides a simple and consistent means of defining and executing those calls in your application. Sycamore is a [mixin](http://bob.yexley.net/dry-javascript-with-mixins/) that you can use to extend your own objects with this functionality. This is probably more effectively described with some examples.

### Your module _without_ sycamore

``` javascript
(function ($, _) {
    var WithoutSycamore = function () {};

    _.extend(WithoutSycamore.prototype, {
        goGetSomethingFromTheServer: function () {
            $.ajax({
                url: "http://example.com/you/need/sycamore",
                type: "get",
                data: {
                    orderBy: "someField",
                    sort: "asc"
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                context: this
            }).done(function (data) {
                // do something with the data that was returned...
            }).fail(function () {
                // OOPS! something went wrong...might wanna let the user know
            });
        },

        sendSomethingToTheServer: function () {
            $.ajax({
                url: "http://example.com/eewww/look/at/all/this/boilerplate/code",
                type: "post",
                data: {
                    name: "Foo",
                    description: "Bar",
                    notes: "We're creating a new object on the server"
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                context: this
            }).done(function (data) {
                // add the new object to some collection on the client...
            }).fail(function () {
                // OOPS! something went wrong...might wanna let the user know
            });
        },

        updateSomethingOnTheServer: function () {
            $.ajax({
                url: "http://example.com/something/should/be/done/about/this",
                type: "get",
                data: {
                    id: 123456789,
                    name: "Foo (updated)",
                    description: "Bar (updated)"
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                context: this
            }).done(function (data) {
                // update the client with the updated object...
            }).fail(function () {
                // OOPS! something went wrong...might wanna let the user know
            });
        },

        deleteSomethingFromTheServer: function () {
            $.ajax({
                url: "http://example.com/we/can/do/better/than/this",
                type: "delete",
                data: {
                    id: 123456789
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                context: this
            }).done(function (data) {
                // remove the item from the client as well...
            }).fail(function () {
                // OOPS! something went wrong...might wanna let the user know
            });
        }
    });

    return WithoutSycamore;
}(jquery, underscore));
```

Lots of messy, repetitive boilerplate there, huh? What happens when you need or want to start sending some custom headers with those requests? What about caching the results? Those are the kinds of things that sycamore can help clean up for you. Lets take a look at what a module written using sycamore looks like, with the same functionality as above...

### Your module _with_ sycamore
``` javascript
(function ($, _, Requester) {
    var WithSycamore = function () {};

    _.extend(WithSycamore.prototype, Requester, {
        requests: {
            getSomethingFromTheServer: {
                url: "http://example.com/much/better/with/sycamore",
                data: {
                    orderBy: "someField",
                    sort: "asc"
                },
                done: "onGetSomethingFromTheServerDone",
                fail: "serverRequestFailed"
            },
            sendSomethingToTheServer: {
                url: "http://example.com/aahhh/no/more/repetitive/boilerplate/code",
                type: "post",
                data: {
                    name: "Foo",
                    description: "Bar",
                    notes: "We're creating a new object on the server"
                },
                done: "onSendSomethingToTheServerDone",
                fail: "serverRequestFailed"
            },
            updateSomethingOnTheServer: {
                url: "http://example.com/this/is/much/nicer",
                type: "put"
            },
            deleteSomethingFromTheServer: {
                url: "http://example.com/i/knew/we/could/do/better",
                type: "delete"
            }
        },

        getSomethingFromTheServer: function () {
            this.execute(this.requests.getSomethingFromTheServer);
            // alternately, if you prefer the syntax, you could also use the `fetch` function
            // this.fetch(this.requests.getSomethingFromTheServer);
        },

        onGetSomethingFromTheServerDone: function (data) {
            // do something with the data that was returned...
        },

        sendSomethingToTheServer: function () {
            this.execute(this.requests.sendSomethingToTheServer);
        },

        onSendSomethingToTheServerDone: function (data) {
            // add the new object to some collection on the client...
        },

        updateSomethingOnTheserver: function () {
            this.execute(this.requests.updateSomethingOnTheServer, {
                    id: 123456789,
                    name: "Foo (updated)",
                    description: "Bar (updated)"
                })
                .done(this.onUpdateSomethingOnTheServer)
                .fail(this.serverRequestFailed);
        },

        onUpdateSomethingOnTheServerDone: function (data) {
            // update the client with the updated object...
        },

        deleteSomethingFromTheServer: function (itemId) {
            this.execute(this.requests.deleteSomethingFromTheServer, { id: itemId })
                .done(this.onDeleteSomethingFromTheServer)
                .fail(this.serverRequestFailed);
        },

        onDeleteSomethingFromTheServer: function () {
            // remove the item from the client as well...
        },

        serverRequestFailed: function () {
            // OOPS! something went wrong...lets let the user know about it...
        }
    });

    return WithSycamore;
}(jquery, underscore, Requester));
```

Hopefully those samples help draw a clear enough picture of how sycamore was designed to work.

____

## Documentation

### Get it

Using Bower:

```
bower install sycamore [--save]
```

Or just download it: [Minified](https://raw.github.com/ryexley/sycamore/master/dist/requester.min.js) | [Uncompressed](https://raw.github.com/ryexley/sycamore/master/dist/requester.js) | [Full package archive](https://github.com/ryexley/sycamore/archive/master.zip)

### Usage

As mentioned previously, sycamore is a [mixin](http://bob.yexley.net/dry-javascript-with-mixins/). To use it, you simply need to import/reference/load it:

``` javascript
// AMD/RequireJS
// main.js
require.config({
    paths: {
        "requester": "/path/to/requester"
    }
});

// your-module.js
define(["requester"], function (Requester) {
    // extend your module with Requester...see below...
});
```

``` javascript
// CommonJS/node
var Requester = require("/path/to/requester");
```

``` html
<!-- Browser script reference -->
<script src="/path/to/requester.js"></script>
```

and then extend your module or object with it:

``` javascript
// constructor function
var YourModule = function () {
    // initialize your module here...
};

// extend it with underscore.js...
_.extend(YourModule.prototype, Requester, {
    // your module implementation
});

// extend it with jQuery if you prefer...
$.extend({}, YourModule.prototype, Requester, {
    // your module implementation
});

return YourModule;
```

Now go forth and request...

### Requests

There's no right or wrong way to define your requests, really. Ultimately, the way sycamore works is that it adds an `execute` function to your object, that takes two arguments: a request definition object, and an optional data payload to use with the request.

The following sample code will be used for reference throughout the documentation below:

``` javascript
// sample-module-requests.js
(function () {
    var sampleModuleRequests = {
        sampleGet: {
            url: "http://example.com/foo/{id}",
            done: "onSampleGetDone",
            fail: "onRequestFail",
            cache: {
                key: "some-unique-cache-key",
                expiresAfter: 5,
                source: "local"
            }
        },

        samplePost: {
            url: "http://example.com/foo",
            data: "createNewObject",
            done: "onSamplePostDone",
            fail: "onRequestFail"
        },

        samplePut: {
            url: "http://example.com/foo/{id}"
        },

        sampleDelete: {
            url: "http://example.com/foo/{id}"
        }
    };

    return sampleModuleRequests;
}());
```

``` javascript
// sample-module.js
(function ($, _, requester, sampleModuleRequests) {
    var SampleModule = function () {
        this.requests = sampleModuleRequests;
    };

    _.extend(SampleModule.prototype, requester, {
        onSampleGetDone: function (data) {
            // do something with the data returned from the server
        },

        createNewObject: function () {
            return {
                name: "Foo",
                description: "just some new object",
                notes: []
            };
        },

        onSamplePostDone: function (data) {
            // do something with the new object that was created...
        },

        updateSomething: function (objId) {
            this.execute(this.requests.samplePut, { id: objId })
                .done(this.onSamplePutDone)
                .fail(this.onRequestFail);
        },

        onSamplePutDone: function (data) {
            // do something with the data returned from the update request
        },

        onRequestFail: function (data) {
            // some request failed...let the user know about it
        }
    });

    return SampleModule;
}(jquery, underscore, requester, sampleModuleRequests));
```

#### Defining Requests

The request parameter that the `execute` function accepts is [a simple object literal](http://api.jquery.com/Types/#PlainObject) with [any of the standard settings that the jQuery `$.ajax` function can take](http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings). The most commonly expected settings on the object are listed below, with their default values, along with some examples.

* `<setting name>`: &lt;default value&gt;
* `url`: REQUIRED. No default value. This is the _only_ setting thats required.
* `type`: GET
* `headers`: {}
* `data`: {}
* `dataType`: json
* `contentType`: "application/json; charset=utf-8"
* `context`: this

You _can_ pass any object with the appropriate settings on it that you want, but, as in the sample above, I prefer to define my request definition objects off of a parent object, so they can be referenced by name when passed to the `execute` function, as in:

``` javascript
this.execute(this.requests.sampleGet);
```

Just a little cleaner and easier to read in my opinion.

#### Executing Requests and passing data (request payloads)
As mentioned previously, sycamore adds an `execute` function to your module. Making a request to the server is as simple as calling this function and passing it a request definition and an optional data payload. Take, for example, the `sampleGet` request definition from the example requests above:

``` javascript
this.execute(this.requests.sampleGet);
```

Optionally, you can pass a payload as a second argument to the `execute` function that will be used as the `data` parameter with the request sent to the server. Consider the `samplePut` request above:

``` javascript
this.execute(this.requests.samplePut, {
    id: 12345,
    name: "Bar",
    description: "Foo has been updated and is now Bar"
});
```

This is a unique example because it demonstrates how sycamore will handle payloads for requests that have tokenized URLs. Notice that the URL parameter for this request has an `{id}` token embedded in the URL. Also note that the sample payload submitted as the second argument to the call to `execute` above includes values for `id`, `name` and `description`.

For requests such as this, internally, sycamore will evaluate the payload submitted with the request and compare it against any tokens in the URL. For any tokens that are found, the token in the URL will be replaced with the value from the payload, and that value will then be stripped from the payload and not sent to the server as part of the `data` sent with the request. So, in this case, a `PUT` request would be submitted to `http://example.com/foo/12345` with a `data` payload of `{ name: "Bar", description: "Foo has been updated and is now Bar" }`.

#### Handling callbacks/responses
There are a couple of different ways that callbacks can be handled in sycamore. As of jQuery version 1.5, the `jqXHR` object returned by the `$.ajax` function implements the Promise interface (see [information on the `$.Deferred` object for more details about this](http://api.jquery.com/category/deferred-object/)). This is the object that is returned by sycamore's `execute` function. This fact allows you to be able to chain callback methods to the result of the `execute` function. Sycamore allows you to do this one of two primary ways:

Your first option is to set the name of the function to handle your callback on the request definition that gets passed to the call to `execute`. You can see an example of this on the `sampleGet` and `samplePost` requests in the example above. Notice how `samplePost` has "done" and "fail" options set on it for `onSamplePostDone` and `onRequestFail` respectively? This tells the execute function to bind those functions to the `done` and `fail` callbacks of the `jqXHR` objects that is returned from the execution of the `$.ajax` call, and will execute them at the appropriate time, with `this` as the default context for execution.

The other option, is to chain your callbacks directly to the `execute` function itself. As mentioned previously, the `execute` function returns the `jqXHR` object that is returned from the `$.ajax` call, so it can have callbacks chained directly onto it. In the sample above, note that neither the `samplePut` or the `sampleDelete` requests have any callbacks defined on them at all. Handling callbacks on those requests would look like this:

``` javascript
this.execute(this.requests.samplePut)
    .done(this.onSamplePutDone)
    .fail(this.onRequestFail);
```

``` javascript
this.execute(this.requests.sampleDelete)
    .done(this.onSampleDeleteDone) // or whatever function you define for this callback...its not defined above
    .fail(this.onRequestFail);
```

#### Caching results
Sycamore can also handle caching of request results for you as well. Caching is handled by defining a cache option on your request definition. The `cache` object on the request definition expects three options:

* `key`: cached results are stored in a hash, and this option defines the key that will be used in the hash to store and retrieve the cached data
* `expiresAfter`: the amount of time (in **minutes**) to cache the results for
* `source` (optional): this option should only be used if you wish to override the default cache source, which is in memory, and use [localStorage](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage#localStorage) instead. If you wish to use localStorage as your cache store, use this option and set its value to `local`. Any other value on this setting and sycamore will assume and use an in memory cache store.

See the `sampleGet` request definition above for an example of setting request cache options.

_**NOTE:** There are a couple of minor known issues with the current implementation of caching that are on the current roadmap to fix in the near future. Please note that when these issues are fixed, the option name will likely change from `cache` to something different that the already-defined `$.ajax` option. The other known issue is with the uniqueness of the cache key for multiple `GET` requests with unique URL values._
