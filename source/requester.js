(function (_, $) {

	var setupRequests = function (target, options) {
		console.log("setting up requests...");
	};

    var Requester = function (options) {
    	options = options || {};
    	this._init(options);
    	this.init.call(this, options);
    };

    _.extend(Requester.prototype, {

    	_init: function (options) {
    		setupRequests(this, options);
    	},

    	init: function (options) {

    	}

    });

    return Requester;

}(_, window.jquery));
