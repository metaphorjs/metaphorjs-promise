

var assert = require("assert"),
    lib_Promise = require("../dist/metaphorjs.promise.npm.js");


describe("Promise.always", function(){

    it("should trigger callbacks only once", function(){

        var deferred = new lib_Promise,
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