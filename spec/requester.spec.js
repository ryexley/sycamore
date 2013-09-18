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
                url: "http://sycamore.dev/branches",
                done: "onGetBranchesDone",
                fail: "onGetBranchesFail"
            }
        },

        onGetBranchesDone: sinon.spy(),
        onGetBranchesFail: sinon.spy()
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

        });

    });

}());
