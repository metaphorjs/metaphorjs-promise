
describe("Promises/A+ Tests", function() {


    var bind = function(fn, scope) {
        return function() {
            return fn.apply(scope, arguments);
        }
    };

    var Promise = require("../dist/metaphorjs.promise.npm.js");


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

