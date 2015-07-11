// sycamore, v0.5.0 | (c) 2015 Bob Yexley
// Description: A mixin with functionality to wrap jQuery $.ajax calls, and simplify the definition and consumption of $.ajax request options 
// Generated: 2015-07-10 @ 9:58:55
// https://github.com/ryexley/sycamore
// License: http://www.opensource.org/licenses/mit-license

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "underscore"], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"), require("underscore"));
    } else {
        root.Requester = factory(root.$, root._);
    }
}(this, function ($, _) {

    var Requester = {

        defaults: {
            templateSettings: {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /{([\s\S]+?)}/g,
                escape: /<%-([\s\S]+?)%>/g
            }
        },

        _memoryCache: {},

        requestDefaults: {
            preserveUrlTokensInPayload: {
                get: false,
                put: true,
                post: true,
                "delete": false
            }
        },

        mapRequestData: function (request) {
            var mappedRequest = {};

            _.each(request, function (value, key) {
                if (this._executeOptions[key]) {
                    mappedRequest[key] = this._executeOptions[key](value, this);
                } else {
                    mappedRequest[key] = value;
                }
            }, this);

            return mappedRequest;
        },

        /* jshint unused:false */
        _executeOptions: {
            headers: function (target, context) {
                if (context[target]) {
                    return context[target];
                } else {
                    return target;
                }
            },

            data: function (target, context) {
                if (context[target]) {
                    return context[target];
                } else {
                    return target;
                }
            },

            done: function (target, context) {
                return context[target];
            },

            fail: function (target, context) {
                return context[target];
            }
        },
        /* jshint unused:true */

        _isLocalStorageSupported: function () {
            var test = "supported";
            try {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },

        _cacheData: function (cache, data) {
            if (cache.store === "local" && this._isLocalStorageSupported()) {
                var requestDataCache = JSON.parse(localStorage.getItem("requestDataCache")) || {};
                requestDataCache[cache.key] = data;
                localStorage.setItem("requestDataCache", JSON.stringify(requestDataCache));
            } else {
                this._memoryCache[cache.key] = data;
            }

            cache.expires = this.dates.addMinutes(+new Date(), cache.expiresAfter);
        },

        _getCachedData: function (cache) {
            if (cache.store === "local" && this._isLocalStorageSupported()) {
                var requestDataCache = JSON.parse(localStorage.getItem("requestDataCache"));
                return requestDataCache[cache.key];
            } else {
                return this._memoryCache[cache.key];
            }
        },

        _processHeaders: function (headers) {
            var result = {};

            if (!_.isEmpty(headers)) {
                _.each(headers, function (headerValue, headerKey) {
                    if (_.isFunction(headerValue)) {
                        result[headerKey] = headerValue();
                    } else {
                        result[headerKey] = headerValue;
                    }
                });
            }

            return result;
        },

        execute: function (params, data) {
            var self = this;
            var requestData;

            if (params.cache) {
                var expired = true;
                if (params.cache.expires) {
                    if (this.dates.compare(+new Date(), params.cache.expires) < 0) {
                        expired = false;
                    }
                }

                if (!expired) {
                    var cached = self._getCachedData(params.cache);
                    if (cached) {
                        var response = $.Deferred();
                        response.resolve(cached);
                        return response.promise();
                    }
                }
            }

            params = this.mapRequestData(params);

            params.processedHeaders = self._processHeaders(params.headers || {});

            if (_.isFunction(params.data)) {
                requestData = params.data.call(params.context || self);
            } else {
                requestData = params.data;
            }

            requestData = data !== undefined ? _.extend({}, requestData, data) : requestData;

            if ((params.url.indexOf("{") && params.url.indexOf("}")) && (!_.isEmpty(requestData))) {
                var unused = [],
                    encodedData = _.clone(requestData);

                // ensure that pieces used in URL are properly encoded
                _.each(encodedData, function (value, key) {
                    if (typeof value === "string") {
                        encodedData[key] = encodeURIComponent(value);
                    }
                });

                // if (!params.type || params.type.toLowerCase() === "get") {
                params.type = params.type || "get";
                if (!this.requestDefaults.preserveUrlTokensInPayload[params.type.toLowerCase()]) {
                    var urlTokens = params.url.match(/{(.*?)}/g);
                    _.each(urlTokens, function (token) {
                        token = token.replace("{", "").replace("}", "");

                        if (!(token in requestData)) {
                            encodedData[token] = "";
                        }

                        unused.push(token);
                    });
                }

                params.url = this._template(params.url, encodedData);

                _.each(unused, function (token) {
                    delete requestData[token];
                });
            }

            if (params.delayFor) {
                return self._executeDelayed(params, requestData);
            } else {
                return self._execute(params, requestData);
            }
        },

        buildRequest: function (params, data) {
            if (params.buildRequest) {
                return params.buildRequest.call(this, params, data);
            } else {
                return this._buildRequest(params, data);
            }
        },

        _buildRequest: function (params, data) {
            var type = params.type && params.type.toLowerCase(),
                dataNeedsStringified = (type === "put" || type === "post" || type === "patch"),
                contentTypeJson = (!params.contentType || params.contentType.indexOf("json") > -1),
                dataIsStringified = (typeof(data) === "string");

            if (data && !dataIsStringified && dataNeedsStringified && contentTypeJson) {
                data = JSON.stringify(data || {});
            }

            var request = {
                url: params.url,
                type: params.type || "get",
                headers: params.processedHeaders || {},
                data: data,
                dataType: params.dataType || "json",
                contentType: params.contentType || "application/json; charset=utf-8",
                context: params.context || this
            };

            if (request.type.toLowerCase() === "get" && params.nocache) {
                request.cache = !params.nocache;
            }

            return $.ajax(request);
        },

        _execute: function (params, requestData) {
            var self = this;

            var request = this.buildRequest(params, requestData);

            request.done(function (response) {
                if (params.cache) {
                    self._cacheData(params.cache, response);
                }
            });

            self._handleConfiguredCallbacks(params, request);

            return request;
        },

        _executeDelayed: function (params, requestData) {
            var self = this;
            var request;
            var delayProxy = $.Deferred();

            setTimeout(function () {
                request = self.buildRequest(params, requestData)
                .done(function () {
                    delayProxy.resolve.apply(request, arguments);
                })
                .fail(function () {
                    delayProxy.reject.apply(request, arguments);
                });

                request.done(function (response) {
                    if (params.cache) {
                        self._cacheData(params.cache, response);
                    }
                });

                self._handleConfiguredCallbacks(params, request);

            }, params.delayFor);

            return delayProxy.promise();
        },

        _handleConfiguredCallbacks: function (params, request) {
            var self = this;

            if (params.done) {
                request.done(params.done.bind(params.context || self));
            }

            if (params.fail) {
                request.fail(params.fail.bind(params.context || self));
            }

            if (params.always) {
                request.always(params.always.bind(params.context || self));
            }
        },

        // adapted from the underscore.js _.template function
        // https://github.com/jashkenas/underscore
        _template: function (target, data) {
            var settings = _.defaults({}, this.defaults.templateSettings);

            // When customizing `templateSettings`, if you don't want to define an
            // interpolation, evaluation or escaping regex, we need one that is
            // guaranteed not to match.
            var noMatch = /(.)^/;

            // Certain characters need to be escaped so that they can be put into a
            // string literal.
            var escapes = {
                "'": "'",
                "\\": "\\",
                "\r": "r",
                "\n": "n",
                "\u2028": "u2028",
                "\u2029": "u2029"
            };

            var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

            var escapeChar = function(match) {
                return "\\" + escapes[match];
            };

            // Combine delimiters into one regular expression via alternation.
            var matcher = new RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join("|") + "|$", "g");

            // Compile the template source, escaping string literals appropriately.
            var index = 0;
            var source = "__p+='";

            /* jshint -W072 */
            target.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                source += target.slice(index, offset).replace(escapeRegExp, escapeChar);
                index = offset + match.length;

                if (escape) {
                    source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
                } else if (interpolate) {
                    source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
                } else if (evaluate) {
                    source += "';\n" + evaluate + "\n__p+='";
                }

                // Adobe VMs need the match returned to produce the correct offset.
                return match;
            });
            /* jshint +W072 */
            source += "';\n";

            // If a variable is not specified, place data values in local scope.
            if (!settings.variable) {
                source = "with(obj||{}){\n" + source + "}\n";
            }

            source = "var __t,__p='',__j=Array.prototype.join," +
                "print=function(){__p+=__j.call(arguments,'');};\n" +
                source + "return __p;\n";

            var render;

            try {
                /* jshint -W054 */
                render = new Function(settings.variable || "obj", "_", source);
                /* jshint +W054 */
            } catch (e) {
                e.source = source;
                throw e;
            }

            var template = function(data) {
                return render.call(this, data, _);
            };

            // Provide the compiled source as a convenience for precompilation.
            var argument = settings.variable || "obj";
            template.source = "function(" + argument + "){\n" + source + "}";

            return template(data);
        },

        // This is just an alias/wrapper for the execute function, in case you prefer this terminology
        fetch: function (params) {
            return this.execute(params);
        },

        // adapted from http://stackoverflow.com/questions/497790
        dates: {
            convert: function (date) {
                // Converts the date in `date` to a date-object. The input can be:
                //   a date object: returned without modification
                //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
                //   a number     : Interpreted as number of milliseconds
                //                  since 1 Jan 1970 (a timestamp)
                //   a string     : Any format supported by the javascript engine, like
                //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
                //  an object     : Interpreted as an object with year, month and date
                //                  attributes.  **NOTE** month is 0-11.
                var results = (
                    date.constructor === Date ? date :
                    date.constructor === Array ? new Date(date[0], date[1], date[2]) :
                    date.constructor === Number ? new Date(date) :
                    date.constructor === String ? new Date(date) :
                    typeof date === "object" ? new Date(date.year, date.month, date.date) :
                    NaN // this.addMinutes(Date.now(), -(60 * 24 * 365 * 100)) // 100 years ago
                );

                return results;
            },

            compare: function (a, b) {
                // Compare two dates (could be of any type supported by the convert
                // function above) and returns:
                //  -1 : if a < b
                //   0 : if a = b
                //   1 : if a > b
                // NaN : if a or b is an illegal date
                // NOTE: The code inside isFinite does an assignment (=).
                var results = (
                    isFinite(a = this.convert(a).valueOf()) &&
                    isFinite(b = this.convert(b).valueOf()) ?
                    (a > b) - (a < b) :
                    false
                );

                return results;
            },

            inRange: function (date, start, end) {
                // Checks if date in `date` is between dates in start and end.
                // Returns a boolean or NaN:
                //    true  : if date is between start and end (inclusive)
                //    false : if date is before start or after end
                //    NaN   : if one or more of the dates is illegal.
                // NOTE: The code inside isFinite does an assignment (=).
                var results = (
                    isFinite(date = this.convert(date).valueOf()) &&
                    isFinite(start = this.convert(start).valueOf()) &&
                    isFinite(end = this.convert(end).valueOf()) ?
                    start <= date && date <= end :
                    NaN
                );

                return results;
            },

            addMinutes: function (date, minutes) {
                if (isFinite(date = this.convert(date).valueOf())) {
                    var target = this.convert(date);
                    return this.convert(target.setMinutes(target.getMinutes() + minutes));
                }

                return false;
            }
        }

    };

    return Requester;

}));
