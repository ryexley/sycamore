(function() {

    // Polyfill for Function.prototype.bind, which doesn't exist in PhantomJS
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function() {},
                fBound = function() {
                    return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    var expect = chai.expect;
    var should = chai.should;
    var assert = chai.assert;

    var ajaxStub;

    var RequesterTester = function(options) {
        this.options = options || {};
    };

    _.extend(RequesterTester.prototype, Requester, {
        requests: {
            getBranches: {
                url: "http://example.com/branches",
                done: "onGetBranchesDone",
                fail: "onGetBranchesFail"
            },

            getBranch: {
            	url: "http://example.com/branches/12345"
            },

            getLeaf: {
            	url: "http://example.com/leaves/12345",
            	data: {
            		branchId: "12345"
            	},
            	done: "onGetLeafDone"
            },

            getTwig: {
            	url: "http://example.com/twigs/12345",
            	data: "getTwigData",
            	done: "onGetTwigDone"
            },

            getTrunk: {
            	url: "http://example.com/tree/12345/trunk",
            	data: function () {
            		return {
            			mountain: 23456,
            			grove: 34567
            		};
            	},
            	done: "onGetTrunkDone"
            }
        },

        getTwigData: function () {
        	return {
        		branchId: "12345",
        		leaves: [1, 2, 3, 4, 5]
        	};
        },

        onGetBranchesDone: sinon.spy(),
        onGetBranchesFail: sinon.spy(),
        onGetBranchDone: sinon.spy(),
        onGetLeafDone: sinon.spy(),
        onGetTwigDone: sinon.spy(),
        onGetTrunkDone: sinon.spy()
    });

    describe("Requester", function() {

        var requesterTester;

        beforeEach(function() {
            requesterTester = new RequesterTester();
            ajaxStub = sinon.stub($, "ajax", function() {
                return $.Deferred();
            });
        });

        afterEach(function() {
            $.mockjaxClear();
            requesterTester = null;
            ajaxStub.restore();
            localStorage.clear();
        });

        describe("instances", function() {
            // it("sandbox test...for experimenting with stuff", function (done) {
            // });
        });

        describe("execute function", function() {

            it("should initialize requests on first call to `execute`", function() {
            	var rt = requesterTester;
                expect(rt._requestsInitialized).to.be.false;
                expect(rt._requests).to.be.empty;

                rt.execute(rt.requests.getBranches).resolve();

                expect(rt._requestsInitialized).to.be.true;
                expect(rt._requests).not.to.be.empty;
                expect(rt._requests.getBranches).to.exist;
            });

            it("should be able to execute a pre-defined request", function() {
                requesterTester.execute(requesterTester.requests.getBranches).resolve();
                expect(requesterTester.onGetBranchesDone.called).to.be.true;
            });

            it("should execute pre-defined requests with the correct options", function () {
            	var rt = requesterTester;
            	rt.execute(rt.requests.getBranches).resolve();
            	expect(ajaxStub.lastCall.args[0].type).to.equal("get");
            	expect(ajaxStub.lastCall.args[0].url).to.equal("http://example.com/branches");
            });

            it("should execute pre-defined requests with the proper context", function () {
            	var rt = requesterTester;
            	rt.execute(rt.requests.getBranches).resolve();
            	expect(rt.onGetBranchesDone.lastCall.thisValue).to.equal(rt);
            });

            it("should execute pre-defined fail callbacks when execute fails", function () {
            	var rt = requesterTester;
            	rt.execute(rt.requests.getBranches).reject();
            	expect(rt.onGetBranchesFail.called).to.be.true;
            });

           	it("should execute chained callbacks on execution", function () {
    			var rt = requesterTester;
    			rt.execute(rt.requests.getBranch).done(rt.onGetBranchDone).resolve();
    			expect(rt.onGetBranchDone.called).to.be.true;
			});

			it("should accept and use static data as a data parameter", function () {
				var rt = requesterTester;
				rt.execute(rt.requests.getLeaf).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.branchId).to.equal("12345");
			});

			it("should accept and execute a pre-defined function as the data parameter", function () {
				var rt = requesterTester;
				rt.execute(rt.requests.getTwig).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.branchId).to.equal("12345");
				expect(callData.leaves).to.be.an("array");
				expect(callData.leaves.length).to.equal(5);
			});

			it("should accept and execute an anonymous function as a data parameter", function () {
				var rt = requesterTester;
				rt.execute(rt.requests.getTrunk).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.mountain).to.equal(23456);
				expect(callData.grove).to.equal(34567);
			});

        });

    });

}());
