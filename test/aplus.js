

var bind = require("../../metaphorjs/src/func/bind.js");

describe("Promises/A+ Tests", function() {

    var Promise = require("../src/metaphorjs.promise.js");

    var adapter = {
        deferred: function() {

            var promise = new Promise;

            return {
                promise: promise,
                resolve: bind(promise.resolve, promise),
                reject: bind(promise.reject, promise)
            };

        }
    };


    require("promises-aplus-tests").mocha(adapter);
});

