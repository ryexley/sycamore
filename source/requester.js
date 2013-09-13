(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["$", "_"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require("$"), require("_"));
    } else {
        root.Requester = factory(root.$, root._);
    }
}(this, function ($, _) {

    var Requester = {

        _requestsInitialized: false,

        _requests: {},

        _memoryCache: {},

        _setupRequests: function () {
            var self = this;

            if (!self._requestsInitialized) {
                if (self.requests) {
                    _.each(self.requests, function (requestData, requestName) {
                        var request = {};
                        _.each(requestData, function (value, key) {
                            if (key !== "requestRefMap") {
                                request[key] = self._executeOptions[key](value, self);
                            }
                        });

                        self._requests[requestName] = request;
                        self.requests[requestName]["requestRefMap"] = { type: "_requests", name: requestName };
                    });
                }

                self._requestsInitialized = true;
            }
        },

        /* jshint unused:false */
        _executeOptions: {
            url: function (target, context) {
                return target;
            },

            type: function (target, context) {
                return target;
            },

            contentType: function (target, context) {
                return target;
            },

            context: function (target, context) {
                return target;
            },

            data: function (target, context) {
                // return target;
                if (context[target]) {
                    return context[target];
                } else {
                    return target;
                }
            },

            dataType: function (target, context) {
                return target;
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
                var requestDataCache = JSON.parse(localStorage.getItem("requestDataCache"));
                requestDataCache[cache.key] = data;
                localStorage.setItem("requestDataCache", JSON.stringify(requestDataCache));
            } else {
                this._memoryCache[cache.key] = data;
            }

            cache.expires = this.dates.addMinutes(Date.now(), cache.expiresAfter);
        },

        _getCachedData: function (cache) {
            if (cache.store === "local" && this._isLocalStorageSupported()) {
                var requestDataCache = JSON.parse(localStorage.getItem("requestDataCache"));
                return requestDataCache[cache.key];
            } else {
                return this._memoryCache[cache.key];
            }
        },

        execute: function (params) {
            var self = this;
            var requestData;

            if (params.cache) {
                var expired = (params.cache.expires && this.dates.compare(Date.now(), params.cache.expires) > 0);
                if (!expired) {
                    var cached = self._getCachedData(params.cache);
                    if (cached) {
                        return cached;
                    }
                }
            }

            if (!self._requestsInitialized) {
                self._setupRequests();
            }

            params = self[params.requestRefMap.type][params.requestRefMap.name];

            if (_.isFunction(params.data)) {
                requestData = params.data.call(params.context || self);
            } else {
                requestData = params.data;
            }

            var request = $.ajax({
                url: params.url,
                type: params.type || "get",
                data: requestData || {},
                dataType: params.dataType || "json",
                contentType: params.contentType || "application/json; charset=utf-8",
                context: params.context || self
            });

            request.done(function (response) {
                if (params.cache) {
                    self._cacheData(params.cache, response);
                }
            });

            if (params.done) {
                request.done(params.done.bind(params.context || self));
            }

            if (params.fail) {
                request.fail(params.fail.bind(params.context || self));
            }

            if (params.always) {
                request.always(params.always.bind(params.context || self));
            }

            return request;
        },

        // This is just an alias/wrapper for the execute function, in case you prefer this terminology
        fetch: function (params) {
            return this.execute(params);
        },

        // http://stackoverflow.com/questions/497790
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
                return (
                    date.constructor === Date ? date :
                    date.constructor === Array ? new Date(date[0], date[1], date[2]) :
                    date.constructor === Number ? new Date(date) :
                    date.constructor === String ? new Date(date) :
                    typeof date === "object" ? new Date(date.year, date.month, date.date) :
                    NaN
                );
            },

            compare: function (a, b) {
                // Compare two dates (could be of any type supported by the convert
                // function above) and returns:
                //  -1 : if a < b
                //   0 : if a = b
                //   1 : if a > b
                // NaN : if a or b is an illegal date
                // NOTE: The code inside isFinite does an assignment (=).
                return (
                    isFinite(a = this.convert(a).valueOf()) &&
                    isFinite(b = this.convert(b).valueOf()) ?
                    (a > b) - (a < b) :
                    NaN
                );
            },

            inRange: function (date, start, end) {
                // Checks if date in `date` is between dates in start and end.
                // Returns a boolean or NaN:
                //    true  : if date is between start and end (inclusive)
                //    false : if date is before start or after end
                //    NaN   : if one or more of the dates is illegal.
                // NOTE: The code inside isFinite does an assignment (=).
               return (
                    isFinite(date = this.convert(date).valueOf()) &&
                    isFinite(start = this.convert(start).valueOf()) &&
                    isFinite(end = this.convert(end).valueOf()) ?
                    start <= date && date <= end :
                    NaN
                );
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
