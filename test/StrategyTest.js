"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai = require("chai");
const chaiPassportStrategy = require("chai-passport-strategy");
const strategy_1 = require("../dist/lib/strategy");
before(() => {
    chai_1.use(chaiPassportStrategy);
});
describe("Akera Passport Strategy Test", () => {
    describe("Without verification function", () => {
        describe("With Normal Options", () => {
            it("should create a strategy", () => {
                chai_1.expect(() => {
                    const strategy = new strategy_1.Strategy({
                        server: {
                            host: "localhost",
                            port: 8383
                        }
                    });
                }).not.to.throw(Error);
            });
            it("should return akera as strategy name", () => {
                const strategy = new strategy_1.Strategy({
                    server: {
                        host: "localhost",
                        port: 8383
                    }
                });
                chai_1.expect(strategy.name).to.equal("akera");
            });
            it("should throw an error without parameters", () => {
                chai_1.expect(() => new strategy_1.Strategy({})).to.throw(Error);
            });
        });
        describe("Successful Authentication", () => {
            it("should authenticate user", (done) => {
                const strategy = new strategy_1.Strategy({
                    server: {
                        host: "localhost",
                        port: 8383
                    }
                });
                chai.passport.use(strategy)
                    .success(() => {
                    console.log("In success");
                    done();
                })
                    .req((req) => {
                    req.body = {
                        username: "u1",
                        password: "p1"
                    };
                    console.log(req);
                })
                    .authenticate();
            });
        });
    });
    describe("Without verification function", () => {
        const callback = (user, cb) => {
            cb(null, user);
        };
        describe("With Normal Option", () => {
            it("should create a strategy", () => {
                chai_1.expect(() => {
                    new strategy_1.Strategy({
                        server: {
                            host: "localhost",
                            port: 8383
                        }
                    }, callback);
                }).not.to.throw(Error);
            });
            it("should return akera as strategy name", () => {
                const strategy = new strategy_1.Strategy({
                    server: {
                        host: "localhost",
                        port: 8383
                    }
                }, callback);
                chai_1.expect(strategy.name).to.equal("akera");
            });
            it("should throw an error without parameters", () => {
                chai_1.expect(() => new strategy_1.Strategy({}, callback)).to.throw(Error);
            });
        });
    });
});
