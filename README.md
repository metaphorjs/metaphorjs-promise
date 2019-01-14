<a href="http://promisesaplus.com/">
    <img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>
#MetaphorJs.Promise
Promise/A+ compliant library / ES6 Promise polyfill
3k minified and gzipped.

[Docs](http://metaphorjs.com/promise/docs/index.html)

####Constructor
* `new Promise(function(resolve, reject))`
* `new Promise(thenable)`
* `new Promise(resolveValue)`
* `new Promise()`

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
* `promise.always(onFinished[, thisObject])` -> same promise
* `promise.promise()` -> thenable
* `promise.after(promise)`
* `promise.isPending()`
* `promise.isFulfilled()`
* `promise.isResolved()`
* `promise.isRejected()`
* `promise.isCancelled()`
* `promise.hasListeners()`
* `promise.$destroy()`

And some extra class methods:

* `Promise.fcall(fn, context, args)` -> new promise
* `Promise.allResolved(promises)` -> new promise
* `Promise.when(promise1, promise2, ...)` -> new promise
* `Promise.waterfall(functions)` -> new promise
* `Promise.forEach(items, fn, context)` -> new promise
* `Promise.counter(cnt)` -> new promise