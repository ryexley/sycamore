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
                    });

                    self._requests[requestName] = request;
                    self.requests[requestName]["requestRefMap"] = { type: "_requests", name: requestName };
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

            data: function (target, context) {
                // return target;
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

        execute: function (params) {
            var self = this;
            var data;

            if (!self._requestsInitialized) {
                self._setupRequests();
            }

            params = self[params.requestRefMap.type][params.requestRefMap.name];

            if (_.isFunction(params.data)) {
                data = params.data.call(params.context || self);
            } else {
                data = params.data;
            }

            var request = $.ajax({
                url: params.url,
                type: params.type || "get",
                data: data || {},
                contentType: params.contentType || "application/json; charset=utf-8",
                context: params.context || self
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

    };

    return Requester;

}));
