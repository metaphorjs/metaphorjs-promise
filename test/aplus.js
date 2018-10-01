

describe("Promises/A+ Tests", function() {

    var lib_Promise = require("../dist/metaphorjs.promise.npm.js");

    var adapter = {
        deferred: function() {

            var promise = new lib_Promise;

            return {
                promise: promise,
                resolve: promise.resolve.bind(promise),
                reject: promise.reject.bind(promise)
            };
        }
    };

    require("promises-aplus-tests").mocha(adapter);
});

