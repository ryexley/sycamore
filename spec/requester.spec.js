(function () {

	var expect = chai.expect;
	var should = chai.should;
	var assert = chai.assert;

	var RequesterTester = function (options) {
		this.options = options || {};
	};

	_.extend(RequesterTester.prototype, Requester, {
		requests: {
			request1: {
				url: "http://example.com/request-1",
				type: "post",
				data: { foo: "request-1-foo", bar: "request-1-bar" },
				done: "request1Done",
				fail: "request1Fail"
			}
		},

		requestOne: function () {
			this.execute(this.requests.request1);
		},

		request1Done: function (data) {
			console.log(data);
		},

		request1Fail: function (data) {
			console.log(data);
		}
	});

	describe("Requester", function () {

		var rt;

		beforeEach(function () {
			rt = new RequesterTester();
		});

		afterEach(function () {
			$.mockjaxClear();
			rt = null;
			localStorage.clear();
		});

		it("mocking ajax calls works", function () {
			$.mockjax({
				url: rt.requests.request1.url,
				responseText: { foo: "bar", bar: "foo" }
			});

			rt.requestOne();
		});

	});

}());
