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
				done: "request1Done"
			}
		},

		request1Done: function (data) {

		}
	});

	describe("Requester", function () {

		var rt;

		beforeEach(function () {
			rt = new RequesterTester();
		});

		afterEach(function () {
			rt = null;
		});

		it("should be able to do basic math", function () {
			expect(1).to.equal(1);
		});

	});

}());
