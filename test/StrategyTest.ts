import {expect, use} from "chai";
import * as chai from "chai";
import * as chaiPassportStrategy from "chai-passport-strategy";
import {Strategy as AkeraStrategy} from "../dist/lib/strategy";

before(() => {
  use(chaiPassportStrategy);
});

describe("Akera Passport Strategy Test", () => {
  describe("Without verification function", () => {
    describe("With Normal Options", () => {
      it("should create a strategy", () => {
        expect(() => {
          const strategy = new AkeraStrategy({
            server: {
              host: "localhost",
              port: 8383
            }
          });
        }).not.to.throw(Error);
      });
      it("should return akera as strategy name", () => {
        const strategy = new AkeraStrategy({
          server: {
            host: "localhost",
            port: 8383
          }
        });
        expect(strategy.name).to.equal("akera");
      });
      it("should throw an error without parameters", () => {
        expect(() => new AkeraStrategy({})).to.throw(Error);
      });
    });

    describe("Successful Authentication", () => {
      // TODO: This fails at this moment
      it("should authenticate user", (done) => {
        const strategy = new AkeraStrategy({
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
            }
          })
          .authenticate();
      })
    });
  });

  describe("Without verification function", () => {
    const callback = (user, cb) => {
      cb(null, user);
    }

    describe("With Normal Option", () => {
      it("should create a strategy", () => {
        expect(() => {
          new AkeraStrategy({
            server: {
              host: "localhost",
              port: 8383
            }
          }, callback);
        }).not.to.throw(Error);
      });
      it("should return akera as strategy name", () => {
        const strategy = new AkeraStrategy({
          server: {
            host: "localhost",
            port: 8383
          }
        }, callback);
        expect(strategy.name).to.equal("akera");
      });
      it("should throw an error without parameters", () => {
        expect(() => new AkeraStrategy({}, callback)).to.throw(Error);
      });
    });
  });
});