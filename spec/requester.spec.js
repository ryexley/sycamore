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

    var FantasyFootball = function(options) {
        this.options = options || {};

        this.requests = {
            getLeagues: {
                url: "http://example.com/leagues",
                done: "onGetLeaguesDone",
                fail: "onGetLeaguesFail",
                headers: {
                    testHeader: "foo"
                }
            },

            getLeague: {
                url: "http://example.com/leagues/{id}",
                done: "onGetLeagueDone",
                fail: "onGetLeagueFail",
                data: function () {
                    return {
                        id: 98765
                    };
                },
                headers: {
                    testHeader: function () {
                        return "bar";
                    }
                }
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

            getMatchup: {
                url: "http://example.com/league/12345/matchup/34567",
                done: "onGetMatchupDone",
                cache: {
                    expiresAfter: 2,
                    key: "matchup"
                },
                nocache: true
            },

            getMatchupStats: {
                url: "http://example.com/league/12345/matchup/{id}/stats",
                done: "onGetMatchupStatsDone",
                fail: "onGetMatchupStatsFail",
                data: { id: 0 }
            },

            createLeague: {
                url: "http://example.com/leages",
                type: "post",
                data: { ownerId: 45678, name: "Lame fantasy league name" },
                done: "onCreateLeagueDone",
                fail: "onCreateLeagueFail"
            },

            getOpponentRecords: {
                url: "http://example.com/{thisTokenShouldGetIgnored}",
                done: "onGetOpponentRecordsDone"
            }
        };

        this.getScheduleData = function () {
            return {
                leagueId: "12345",
                players: [1, 2, 3, 4, 5]
            };
        };

        this.getMatchupStats = function (matchupId) {
            this.execute(this.requests.getMatchupStats, { id: matchupId });
        };

        this.onGetLeaguesDone = sinon.spy();
        this.onGetLeaguesFail = sinon.spy();
        this.onGetLeagueDone = sinon.spy();
        this.onGetLeagueFail = sinon.spy();
        this.onGetTeamDone = sinon.spy();
        this.onGetPlayerDone = sinon.spy();
        this.onGetScheduleDone = sinon.spy();
        this.onGetAthleteDone = sinon.spy();
        this.onGetTeamStatsDone = sinon.spy();
        this.onGetTeamStatsFail = sinon.spy();
        this.onGetPlayerRecordDone = sinon.spy();
        this.onGetMatchupDone = sinon.spy();
        this.onCreateLeagueDone = sinon.spy();
        this.onCreateLeagueFail = sinon.spy();
        this.onGetOpponentRecordsDone = sinon.spy();
    };

    var CopyCat = function (options) {
        this.options = options || {};

        this.requests = {
            getLeagues: {
                url: "http://example.com/copy-cat-leagues",
                done: "onGetLeaguesDone",
                fail: "onGetLeaguesFail"
            }
        };

        this.onGetLeaguesDone = sinon.spy();
        this.onGetLeaguesFail = sinon.spy();
    };

    _.extend(FantasyFootball.prototype, Requester);
    _.extend(CopyCat.prototype, Requester);

    describe("Requester", function() {

        beforeEach(function() {
            this.ff = new FantasyFootball();
            this.executeSpy = {};
            this._executeSpy = {};
            this.ajaxStub = sinon.stub($, "ajax", function() {
                return $.Deferred();
            });
        });

        afterEach(function() {
            this.ff = null;
            this.ajaxStub.restore();
            localStorage.clear();

            if (!_.isEmpty(this.executeSpy) && this.executeSpy.restore) {
                this.executeSpy.restore();
            }

            if (!_.isEmpty(this._executeSpy) && this._executeSpy.restore) {
                this._executeSpy.restore();
            }
        });

        describe("instances", function() {
            // it("sandbox test...for experimenting with stuff", function (done) {
            // });
        });

        describe("execution", function() {

            it("should reset internal requests upon initialization to prevent them from being overwritten", function () {
                var copyCat = new CopyCat();

                copyCat.execute(copyCat.requests.getLeagues).resolve();
                this.ff.execute(this.ff.requests.getLeagues).resolve();
                copyCat.execute(copyCat.requests.getLeagues).resolve();

                var args = this.ajaxStub.lastCall.args[0];
                expect(args.url).to.equal(copyCat.requests.getLeagues.url);
            });

            it("should be able to execute a pre-defined request", function() {
                this.ff.execute(this.ff.requests.getLeagues).resolve();
                expect(this.ff.onGetLeaguesDone.called).to.be.true;
            });

            it("should execute pre-defined requests with the correct options", function () {
                var args;

                this.ff.execute(this.ff.requests.getLeagues).resolve();
                args = this.ajaxStub.lastCall.args[0];
                expect(args.type).to.equal("get");
                expect(args.url).to.equal("http://example.com/leagues");

                this.ff.execute(this.ff.requests.createLeague).resolve();
                args = this.ajaxStub.lastCall.args[0];
                expect(args.type).to.equal("post");
                expect(args.data).to.be.a("string");
                expect(JSON.parse(args.data).ownerId).to.equal(45678);
                expect(this.ff.onCreateLeagueDone.called).to.be.true;
            });

            it("should execute pre-defined requests with the proper context", function () {
                this.ff.execute(this.ff.requests.getLeagues).resolve();
                expect(this.ff.onGetLeaguesDone.lastCall.thisValue).to.equal(this.ff);
            });

            it("should execute pre-defined fail callbacks when execute fails", function () {
                this.ff.execute(this.ff.requests.getLeagues).reject();
                expect(this.ff.onGetLeaguesFail.called).to.be.true;
            });

            it("should execute chained callbacks on execution", function () {
                this.ff.execute(this.ff.requests.getTeam).done(this.ff.onGetTeamDone).resolve();
                expect(this.ff.onGetTeamDone.called).to.be.true;
            });

            it("should accept and use static data as a data parameter", function () {
                this.ff.execute(this.ff.requests.getPlayer).resolve();
                var callData = this.ajaxStub.lastCall.args[0].data;
                expect(callData.teamId).to.equal("12345");
            });

            it("should accept and execute a pre-defined function as the data parameter", function () {
                this.ff.execute(this.ff.requests.getSchedule).resolve();
                var callData = this.ajaxStub.lastCall.args[0].data;
                expect(callData.leagueId).to.equal("12345");
                expect(callData.players).to.be.an("array");
                expect(callData.players.length).to.equal(5);
            });

            it("should accept and execute an anonymous function as a data parameter", function () {
                this.ff.execute(this.ff.requests.getAthlete).resolve();
                var callData = this.ajaxStub.lastCall.args[0].data;
                expect(callData.teamId).to.equal(23456);
                expect(callData.leagueId).to.equal(34567);
            });

            it("should transform tokenized URLs using request data", function () {
                var request = this.ff.requests.getLeague;
                var response = {
                    name: "Our super awesome 'murican fantasy football league",
                    players: ["Joe Bob", "Billy Joe", "Cloyd Rivers"]
                };

                this.ff.execute(request).resolve(response);
                var args = this.ajaxStub.lastCall.args[0];
                expect(args.url).to.equal("http://example.com/leagues/98765");
            });

            it("should transform tokenized URLs using request data", function () {
                var request = this.ff.requests.getLeague;
                var response = {
                    name: "Our super awesome 'murican fantasy football league",
                    players: ["Joe Bob", "Billy Joe", "Cloyd Rivers"]
                };

                this.ff.execute(request, { id: "one / two & three ? four"}).resolve(response);
                var args = this.ajaxStub.lastCall.args[0];
                expect(args.url).to.equal("http://example.com/leagues/one%20%2F%20two%20%26%20three%20%3F%20four");
            });

            it("should accept an optional second parameter for the data to execute with", function () {
                this.executeSpy = sinon.spy(FantasyFootball.prototype, "execute");
                this._executeSpy = sinon.spy(FantasyFootball.prototype, "_execute");

                this.ff.getMatchupStats(10017);

                expect(this.executeSpy.lastCall.args[1]).to.exist;
                expect(this._executeSpy.lastCall.args[1]).to.eql({});
            });

            it("should use static data when optional second parameter for data is undefined", function () {
                this.ff.execute(this.ff.requests.getPlayer, undefined).resolve();
                var callData = this.ajaxStub.lastCall.args[0].data;
                expect(callData.teamId).to.equal("12345");
            });

            it("should remove any tokens used in the URL from request data", function () {
                var _executeSpy = sinon.spy(FantasyFootball.prototype, "_execute");
                var request = this.ff.requests.getMatchupStats;

                this.ff.execute(request, { id: 10017, sort: "desc" });

                expect(_executeSpy.lastCall.args[0].url).to.equal("http://example.com/league/12345/matchup/10017/stats")
                expect(_executeSpy.lastCall.args[1]).to.eql({ sort: "desc" });
            });

            it("should ignore any tokens in the URL that aren't included in the data payload for the request", function () {
                var request = this.ff.requests.getOpponentRecords;
                this.ff.execute(request, { notIn: "tokenizedUrl" });
            });

            it("should accept an object literal for custom headers for the request", function () {
                this.ff.execute(this.ff.requests.getLeagues).resolve();
                var args = this.ajaxStub.lastCall.args[0];

                expect(args.headers).to.exist;
                expect(_.isEmpty(args.headers)).to.be.false;
                expect(args.headers.testHeader).to.equal("foo");
            });

            it("should accept an object with a custom function to resolve a header value", function () {
                this.ff.execute(this.ff.requests.getLeague).resolve();
                var args = this.ajaxStub.lastCall.args[0];

                expect(args.headers).to.exist;
                expect(_.isEmpty(args.headers)).to.be.false;
                expect(args.headers.testHeader).to.equal("bar");
            });

            it("should support a configurable URL token format", function () {
                var url = ""

                url = this.ff._template("/foo/{one}/bar/{two}", { one: 123, two: 456 });
                expect(url).to.equal("/foo/123/bar/456");

                this.ff.defaults.templateSettings = { interpolate: /\${([\s\S]+?)}/g };

                url = this.ff._template("/foo/${one}/bar/${two}", { one: 789, two: "000" });
                expect(url).to.equal("/foo/789/bar/000");

                this.ff.defaults.templateSettings = { interpolate: /<%=([\s\S]+?)%>/g };

                url = this.ff._template("/foo/<%= one %>/bar/<%= two %>", { one: "1", two: "2" });
                expect(url).to.equal("/foo/1/bar/2");
            });

        });

        describe("caching", function () {

            it("should cache response in memory when configured", function () {
                var request = this.ff.requests.getTeamStats;
                var response = { one: "two", three: "four" };

                this.ff.execute(request).resolve(response);
                expect(this.ff.onGetTeamStatsDone.lastCall.args[0]).to.equal(response);
                expect(this.ff._memoryCache[this.ff.requests.getTeamStats.cache.key]).to.exist;
            });

            it("should cache response in localStorage when configured", function () {
                var request = this.ff.requests.getPlayerRecord;
                var response = {
                    playerId: 23456,
                    record: {
                        wins: 4,
                        losses: 1
                    }
                };

                this.ff.execute(request).resolve(response);
                expect(this.ff.onGetPlayerRecordDone.lastCall.args[0]).to.equal(response);
                expect(localStorage["requestDataCache"]).to.exist;

                var cache = JSON.parse(localStorage.requestDataCache);
                expect(cache[request.cache.key]).to.exist;
                expect(cache[request.cache.key]).to.eql(response);
            });

            it("should prevent server requests when cached in memory", function (done) {
                var self = this;
                var request = this.ff.requests.getTeamStats;
                var response = { one: "two", three: "four" };

                this.ff.execute(request).resolve(response);
                setTimeout(function () {
                    var results = self.ff.execute(request);
                    results.done(function (data) {
                        expect(self.ff.onGetTeamStatsDone.calledOnce).to.be.true;
                        expect(data).to.eql(response);
                        done();
                    });
                }, 50);
            });

            it("should prevent server requests when cached in localStorage", function (done) {
                var self = this;
                var request = this.ff.requests.getPlayerRecord;
                var response = {
                    playerId: 23456,
                    record: {
                        wins: 4,
                        losses: 1
                    }
                };

                this.ff.execute(request).resolve(response);
                setTimeout(function () {
                    var results = self.ff.execute(request);
                    results.done(function (data) {
                        expect(self.ff.onGetPlayerRecordDone.calledOnce).to.be.true;
                        expect(data).to.eql(response);
                        done();
                    });
                }, 50);
            });

            it("should request data from the network again after cache has expired", function (done) {
                var self = this;
                var request = this.ff.requests.getMatchup;
                var response = {
                    home: {
                        playerId: 12345,
                        points: 100
                    },
                    guest: {
                        playerId: 23456,
                        points: 115
                    }
                };

                this.ff.execute(request).resolve(response);
                setTimeout(function () {
                    request.cache.expires = self.ff.dates.convert(Date.now());
                    self.ff.execute(request).resolve(response);
                    expect(self.ff.onGetMatchupDone.calledTwice).to.be.true;
                    expect(self.ff._memoryCache[request.cache.key]).to.eql(response);
                    done();
                }, 50);
            });

            it("should not set the cache parameter when `nocache` is not specified on the request", function () {
                var self = this;
                var request = this.ff.requests.getPlayerRecord;
                var response = {
                    playerId: 23456,
                    record: {
                        wins: 4,
                        losses: 1
                    }
                };

                this.ff.execute(request).resolve(response);
                var args = this.ajaxStub.lastCall.args[0];

                expect(args.cache).to.not.exist;
            });

            it("should set the cache parameter when `nocache` is set on the request", function () {
                var self = this;
                var request = this.ff.requests.getMatchup;
                var response = {
                    foo: "bar"
                };

                this.ff.execute(request).resolve(response);
                var args = this.ajaxStub.lastCall.args[0];

                expect(args.cache).to.exist;
                expect(args.cache).to.be.false;
            });

        });

    });

}());
