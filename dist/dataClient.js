// sycamore, v0.2.3 | (c) 2013 Bob Yexley
// Description: A mixin with functionality to wrap jQuery $.ajax calls, and simplify the definition and consumption of $.ajax request options 
// Generated: 2013-10-11 @ 1:58:29
// https://github.com/ryexley/sycamore
// License: http://www.opensource.org/licenses/mit-license

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "underscore", "requester"], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"), require("underscore"), require("requester"));
    } else {
        root.DataClient = factory(root.$, root._, root.requester);
    }
}(this, function ($, _, requester) {

    var DataClient = function (options) {
        options = options || {};
        _.extend(this, options);

        // loop through the requests object and created a method for each
        _.each(this.requests, this.createRequest, this);
    };

    _.extend(DataClient.prototype, requester, {

        createRequest: function (value, key) {
            this[key] = function (data) {
                return this.execute(value, data);
            };
        }

    });

    return DataClient;

}));
