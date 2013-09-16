(function () {

	var expect = chai.expect;
	var should = chai.should;
	var assert = chai.assert;

	var ajaxStub;

	var RequesterTester = function (options) {
		this.options = options || {};
	};

	_.extend(RequesterTester.prototype, Requester, {
		requests: {
			getBranches: {
				url: "http://sycamore.dev/branches",
				done: "onGetBranchesDone",
				fail: "onGetBranchesFail"
			}
		},

		getBranches: function () {
			this.execute(this.requests.getBranches).resolve();
		},

		onGetBranchesDone: sinon.spy(),
		onGetBranchesFail: sinon.spy()
	});

	describe("Requester", function () {

		var requesterTester;

		beforeEach(function () {
			requesterTester = new RequesterTester();
			ajaxStub = sinon.stub($, "ajax", function () {
				return $.Deferred();
			})
		});

		afterEach(function () {
			$.mockjaxClear();
			requesterTester = null;
			ajaxStub.restore();
			localStorage.clear();
		});

		describe("instances", function () {

			// it("sandbox test...for experimenting with stuff", function (done) {
			// });

		});

		describe("execute function", function () {

			it("should initialize requests on first call to `execute`", function () {
				expect(requesterTester._requestsInitialized).to.be.false;
				expect(requesterTester._requests).to.be.empty;

				requesterTester.getBranches();

				expect(requesterTester._requestsInitialized).to.be.true;
				expect(requesterTester._requests).not.to.be.empty;
				expect(requesterTester._requests.getBranches).to.exist;
			});

			it("should be able to execute a pre-defined request", function () {
				requesterTester.getBranches();
				expect(requesterTester.onGetBranchesDone.called).to.be.true;
			});

		});

	});

}());
