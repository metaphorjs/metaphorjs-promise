#MetaphorJs.lib.Promise
Promise/A+ compliant library / ES6 Promise polyfill

<a href="http://promisesaplus.com/">
    <img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

4k minified.

####Constructor
* `new Promise(function(resolve, reject))`
* `new Promise(thenable)`

####Instance
* `promise.then(onFulfill, onReject)` -> new promise
* `promise.catch(onReject)` -> new promise
* `promise.resolve(value)`
* `promise.reject(reason)`

####Static
* `Promise.all(iterable)` -> new promise
* `Promise.race(iterable)` -> new promise
* `Promise.resolve(value)` -> new promise
* `Promise.reject(reason)` -> new promise

Plus a few extra instance methods:

* `promise.done(onDone[, thisObject])` -> same promise
* `promise.fail(onFail[, thisObject])` -> same promise
* `promise.promise()` -> thenable
* `promise.isPending()`
* `promise.isFulfilled()`
* `promise.isRejected()`