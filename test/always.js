
var assert = require("assert"),
    Promise = require("../src/metaphorjs.promise.js");

describe("Promise.always", function(){

    it("should trigger callbacks only once", function(){

        var deferred = new Promise,
            called = 0;

        deferred.always(function(){
            called++;
        });

        deferred.resolve(true);
        deferred.resolve(true);
        deferred.resolve(true);
        deferred.reject(false);

        assert.equal(called, 1);
    });

});