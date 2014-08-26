


var promisesAplusTests = require("promises-aplus-tests");
var Promise = require("../dist/metaphorjs.promise.amd.js");


var bind = function(fn, scope) {
    return function() {
        return fn.apply(scope, arguments);
    }
};


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

promisesAplusTests(adapter, {bail: true}, function (err) {
    // All done; output is in the console. Or check `err` for number of failures.
});