(function (_) {

	var expect = chai.expect;
	var should = chai.should;
	var assert = chai.assert;

	describe("Requester", function () {

		var testRequester;
		var TestRequester = function () {};
		_.extend(TestRequester.prototype, {});

		beforeEach(function () {
			testRequester = new TestRequester();
		});

		afterEach(function () {
			testRequester = null;
		});

		it("should be able to do basic math", function () {
			expect(1).to.equal(1);
		});

	});

}(_));
