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

    var FantasyFootball = function(options) {
        this.options = options || {};
    };

    _.extend(FantasyFootball.prototype, Requester, {
        requests: {
            getLeagues: {
                url: "http://example.com/leagues",
                done: "onGetLeaguesDone",
                fail: "onGetLeaguesFail"
            },

            getTeam: {
            	url: "http://example.com/teams/12345"
            },

            getPlayer: {
            	url: "http://example.com/players/12345",
            	data: {
            		teamId: "12345"
            	},
            	done: "onGetPlayerDone"
            },

            getSchedule: {
            	url: "http://example.com/leagues/12345/schedule",
            	data: "getScheduleData",
            	done: "onGetScheduleDone"
            },

            getAthlete: {
            	url: "http://example.com/athlete/12345",
            	data: function () {
            		return {
            			teamId: 23456,
            			leagueId: 34567
            		};
            	},
            	done: "onGetAthleteDone"
            },

            getTeamStats: {
            	url: "http://example.com/team/56789/stats",
            	cache: {
            		key: "team-stats",
            		expiresAfter: 2
            	},
                done: "onGetTeamStatsDone",
                fail: "onGetTeamStatsFail"
            },

            getPlayerRecord: {
                url: "http://example.com/player/23456/record",
                done: "onGetPlayerRecordDone",
                cache: {
                    key: "player-record",
                    expiresAfter: 5,
                    store: "local"
                }
            },

            createLeague: {
            	url: "http://example.com/leages",
            	type: "post",
            	data: { ownerId: 45678, name: "Lame fantasy league name" },
            	done: "onCreateLeagueDone",
            	fail: "onCreateLeagueFail"
            }
        },

        getScheduleData: function () {
        	return {
        		leagueId: "12345",
        		players: [1, 2, 3, 4, 5]
        	};
        },

        onGetLeaguesDone: sinon.spy(),
        onGetLeaguesFail: sinon.spy(),
        onGetTeamDone: sinon.spy(),
        onGetPlayerDone: sinon.spy(),
        onGetScheduleDone: sinon.spy(),
        onGetAthleteDone: sinon.spy(),
        onGetTeamStatsDone: sinon.spy(),
        onGetTeamStatsFail: sinon.spy(),
        onGetPlayerRecordDone: sinon.spy(),
        onCreateLeagueDone: sinon.spy(),
        onCreateLeagueFail: sinon.spy()
    });

    describe("Requester", function() {

        var ff;

        beforeEach(function() {
            ff = new FantasyFootball();
            ajaxStub = sinon.stub($, "ajax", function() {
                return $.Deferred();
            });
        });

        afterEach(function() {
            $.mockjaxClear();
            ff = null;
            ajaxStub.restore();
            localStorage.clear();
        });

        describe("instances", function() {
            // it("sandbox test...for experimenting with stuff", function (done) {
            // });
        });

        describe("execution", function() {

            it("should initialize requests on first call to `execute`", function() {
                expect(ff._requestsInitialized).to.be.false;
                expect(ff._requests).to.be.empty;

                ff.execute(ff.requests.getLeagues).resolve();

                expect(ff._requestsInitialized).to.be.true;
                expect(ff._requests).not.to.be.empty;
                expect(ff._requests.getLeagues).to.exist;
            });

            it("should be able to execute a pre-defined request", function() {
                ff.execute(ff.requests.getLeagues).resolve();
                expect(ff.onGetLeaguesDone.called).to.be.true;
            });

            it("should execute pre-defined requests with the correct options", function () {
            	ff.execute(ff.requests.getLeagues).resolve();
            	expect(ajaxStub.lastCall.args[0].type).to.equal("get");
            	expect(ajaxStub.lastCall.args[0].url).to.equal("http://example.com/leagues");

            	ff.execute(ff.requests.createLeague).resolve();
            	expect(ajaxStub.lastCall.args[0].type).to.equal("post");
            	expect(ajaxStub.lastCall.args[0].data.ownerId).to.equal(45678);
            	expect(ff.onCreateLeagueDone.called).to.be.true;
            });

            it("should execute pre-defined requests with the proper context", function () {
            	ff.execute(ff.requests.getLeagues).resolve();
            	expect(ff.onGetLeaguesDone.lastCall.thisValue).to.equal(ff);
            });

            it("should execute pre-defined fail callbacks when execute fails", function () {
            	ff.execute(ff.requests.getLeagues).reject();
            	expect(ff.onGetLeaguesFail.called).to.be.true;
            });

           	it("should execute chained callbacks on execution", function () {
    			ff.execute(ff.requests.getTeam).done(ff.onGetTeamDone).resolve();
    			expect(ff.onGetTeamDone.called).to.be.true;
			});

			it("should accept and use static data as a data parameter", function () {
				ff.execute(ff.requests.getPlayer).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.teamId).to.equal("12345");
			});

			it("should accept and execute a pre-defined function as the data parameter", function () {
				ff.execute(ff.requests.getSchedule).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.leagueId).to.equal("12345");
				expect(callData.players).to.be.an("array");
				expect(callData.players.length).to.equal(5);
			});

			it("should accept and execute an anonymous function as a data parameter", function () {
				ff.execute(ff.requests.getAthlete).resolve();
				var callData = ajaxStub.lastCall.args[0].data;
				expect(callData.teamId).to.equal(23456);
				expect(callData.leagueId).to.equal(34567);
			});

        });

		describe("caching", function () {

			it("should cache response in memory when configured", function () {
                var request = ff.requests.getTeamStats;
                var response = { one:"two", three: "four" };

				ff.execute(request).resolve(response);
                expect(ff.onGetTeamStatsDone.lastCall.args[0]).to.equal(response);
                expect(ff._memoryCache[ff.requests.getTeamStats.cache.key]).to.exist;
			});

            it("should cache response in localStorage when configured", function () {
                var request = ff.requests.getPlayerRecord;
                var response = {
                    playerId: 23456,
                    record: {
                        wins: 4,
                        losses: 1
                    }
                };

                ff.execute(request).resolve(response);
                expect(ff.onGetPlayerRecordDone.lastCall.args[0]).to.equal(response);
                expect(localStorage["requestDataCache"]).to.exist;

                var cache = JSON.parse(localStorage.requestDataCache);
                expect(cache[request.cache.key]).to.exist;
                expect(cache[request.cache.key]).to.eql(response);
            });

		});

    });

}());
