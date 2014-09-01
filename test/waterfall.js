
var assert = require("assert");

describe("Promise.waterfall", function(){


    var Promise = require("../src/metaphorjs.promise.js");


    it("must run functions in order they specified", function(done){

        var fourth = new Promise;

        Promise.waterfall([
                function(){
                    return 1;
                },
                function() {
                    var deferred = new Promise;
                    setTimeout(function(){
                        deferred.resolve(2);
                    }, 70);
                    return deferred;
                },
                function(){
                    var deferred = new Promise;
                    setTimeout(function(){
                        deferred.resolve(3);
                    }, 20);
                    return deferred;
                },
                fourth
            ])
            .done(function(value){

                assert.equal(value, 4);
                done();
            })
            .fail(function(){
                done("Promise must have been resolved");
            });

        setTimeout(function(){
            fourth.resolve(4);
        }, 50);
    });



});