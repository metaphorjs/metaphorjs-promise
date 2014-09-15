
var isThenable = require("../../metaphorjs/src/func/isThenable.js"),
    bind = require("../../metaphorjs/src/func/bind.js"),
    isFunction = require("../../metaphorjs/src/func/isFunction.js"),
    strUndef = require("../../metaphorjs/src/var/strUndef.js"),
    error = require("../../metaphorjs/src/func/error.js");



module.exports = function(){

    var PENDING     = 0,
        FULFILLED   = 1,
        REJECTED    = 2,

        queue       = [],
        qRunning    = false,


        nextTick    = typeof process != strUndef ?
                        process.nextTick :
                        function(fn) {
                            setTimeout(fn, 0);
                        },

        // synchronous queue of asynchronous functions:
        // callbacks must be called in "platform stack"
        // which means setTimeout/nextTick;
        // also, they must be called in a strict order.
        nextInQueue = function() {
            qRunning    = true;
            var next    = queue.shift();
            nextTick(function(){
                next[0].apply(next[1], next[2]);
                if (queue.length) {
                    nextInQueue();
                }
                else {
                    qRunning = false;
                }
            }, 0);
        },

        /**
         * add to execution queue
         * @param {Function} fn
         * @param {Object} scope
         * @param {[]} args
         */
        next        = function(fn, scope, args) {
            args = args || [];
            queue.push([fn, scope, args]);
            if (!qRunning) {
                nextInQueue();
            }
        },

        /**
         * returns function which receives value from previous promise
         * and tries to resolve next promise with new value returned from given function(prev value)
         * or reject on error.
         * promise1.then(success, failure) -> promise2
         * wrapper(success, promise2) -> fn
         * fn(promise1 resolve value) -> new value
         * promise2.resolve(new value)
         *
         * @param {Function} fn
         * @param {Promise} promise
         * @returns {Function}
         */
        wrapper     = function(fn, promise) {
            return function(value) {
                try {
                    promise.resolve(fn(value));
                }
                catch (thrownError) {
                    promise.reject(thrownError);
                }
            };
        };


    /**
     * @param {Function} fn -- function(resolve, reject)
     * @param {Object} fnScope
     * @returns {Promise}
     * @constructor
     */
    var Promise = function(fn, fnScope) {

        if (fn instanceof Promise) {
            return fn;
        }

        if (!(this instanceof Promise)) {
            return new Promise(fn, fnScope);
        }

        var self = this,
            then;

        self._fulfills   = [];
        self._rejects    = [];
        self._dones      = [];
        self._fails      = [];

        if (arguments.length > 0) {

            if (then = isThenable(fn)) {
                if (fn instanceof Promise) {
                    fn.then(
                        bind(self.resolve, self),
                        bind(self.reject, self));
                }
                else {
                    (new Promise(then, fn)).then(
                        bind(self.resolve, self),
                        bind(self.reject, self));
                }
            }
            else if (isFunction(fn)) {
                try {
                    fn.call(fnScope,
                            bind(self.resolve, self),
                            bind(self.reject, self));
                }
                catch (thrownError) {
                    self.reject(thrownError);
                }
            }
            else {
                self.resolve(fn);
            }
        }
    };

    Promise.prototype = {

        _state: PENDING,

        _fulfills: null,
        _rejects: null,
        _dones: null,
        _fails: null,

        _wait: 0,

        _value: null,
        _reason: null,

        _triggered: false,

        isPending: function() {
            return this._state == PENDING;
        },

        isFulfilled: function() {
            return this._state == FULFILLED;
        },

        isRejected: function() {
            return this._state == REJECTED;
        },

        _cleanup: function() {
            var self    = this;

            delete self._fulfills;
            delete self._rejects;
            delete self._dones;
            delete self._fails;
        },

        _processValue: function(value, cb) {

            var self    = this,
                then;

            if (self._state != PENDING) {
                return;
            }

            if (value === self) {
                self._doReject(new TypeError("cannot resolve promise with itself"));
                return;
            }

            try {
                if (then = isThenable(value)) {
                    if (value instanceof Promise) {
                        value.then(
                            bind(self._processResolveValue, self),
                            bind(self._processRejectReason, self));
                    }
                    else {
                        (new Promise(then, value)).then(
                            bind(self._processResolveValue, self),
                            bind(self._processRejectReason, self));
                    }
                    return;
                }
            }
            catch (thrownError) {
                if (self._state == PENDING) {
                    self._doReject(thrownError);
                }
                return;
            }

            cb.call(self, value);
        },


        _callResolveHandlers: function() {

            var self    = this;

            self._done();

            var cbs  = self._fulfills,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [self._value]);
            }

            self._cleanup();
        },


        _doResolve: function(value) {
            var self    = this;

            self._value = value;
            self._state = FULFILLED;

            if (self._wait == 0) {
                self._callResolveHandlers();
            }
        },

        _processResolveValue: function(value) {
            this._processValue(value, this._doResolve);
        },

        /**
         * @param {*} value
         */
        resolve: function(value) {

            var self    = this;

            if (self._triggered) {
                return self;
            }

            self._triggered = true;
            self._processResolveValue(value);

            return self;
        },


        _callRejectHandlers: function() {

            var self    = this;

            self._fail();

            var cbs  = self._rejects,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [self._reason]);
            }

            self._cleanup();
        },

        _doReject: function(reason) {

            var self        = this;

            self._state     = REJECTED;
            self._reason    = reason;

            if (self._wait == 0) {
                self._callRejectHandlers();
            }
        },


        _processRejectReason: function(reason) {
            this._processValue(reason, this._doReject);
        },

        /**
         * @param {*} reason
         */
        reject: function(reason) {

            var self    = this;

            if (self._triggered) {
                return self;
            }

            self._triggered = true;

            self._processRejectReason(reason);

            return self;
        },

        /**
         * @param {Function} resolve -- called when this promise is resolved; returns new resolve value
         * @param {Function} reject -- called when this promise is rejects; returns new reject reason
         * @returns {Promise} new promise
         */
        then: function(resolve, reject) {

            var self            = this,
                promise         = new Promise,
                state           = self._state;

            if (state == PENDING || self._wait != 0) {

                if (resolve && isFunction(resolve)) {
                    self._fulfills.push([wrapper(resolve, promise), null]);
                }
                else {
                    self._fulfills.push([promise.resolve, promise])
                }

                if (reject && isFunction(reject)) {
                    self._rejects.push([wrapper(reject, promise), null]);
                }
                else {
                    self._rejects.push([promise.reject, promise]);
                }
            }
            else if (state == FULFILLED) {

                if (resolve && isFunction(resolve)) {
                    next(wrapper(resolve, promise), null, [self._value]);
                }
                else {
                    promise.resolve(self._value);
                }
            }
            else if (state == REJECTED) {
                if (reject && isFunction(reject)) {
                    next(wrapper(reject, promise), null, [self._reason]);
                }
                else {
                    promise.reject(self._reason);
                }
            }

            return promise;
        },

        /**
         * @param {Function} reject -- same as then(null, reject)
         * @returns {Promise} new promise
         */
        "catch": function(reject) {
            return this.then(null, reject);
        },

        _done: function() {

            var self    = this,
                cbs     = self._dones,
                cb;

            while (cb = cbs.shift()) {
                try {
                    cb[0].call(cb[1] || null, self._value);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
        },

        /**
         * @param {Function} fn -- function to call when promise is resolved
         * @param {Object} fnScope -- function's "this" object
         * @returns {Promise} same promise
         */
        done: function(fn, fnScope) {
            var self    = this,
                state   = self._state;

            if (state == FULFILLED && self._wait == 0) {
                try {
                    fn.call(fnScope || null, self._value);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state == PENDING) {
                self._dones.push([fn, fnScope]);
            }

            return self;
        },

        _fail: function() {

            var self    = this,
                cbs     = self._fails,
                cb;

            while (cb = cbs.shift()) {
                try {
                    cb[0].call(cb[1] || null, self._reason);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
        },

        /**
         * @param {Function} fn -- function to call when promise is rejected.
         * @param {Object} fnScope -- function's "this" object
         * @returns {Promise} same promise
         */
        fail: function(fn, fnScope) {

            var self    = this,
                state   = self._state;

            if (state == REJECTED && self._wait == 0) {
                try {
                    fn.call(fnScope || null, self._reason);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state == PENDING) {
                self._fails.push([fn, fnScope]);
            }

            return self;
        },

        /**
         * @param {Function} fn -- function to call when promise resolved or rejected
         * @param {Object} fnScope -- function's "this" object
         * @return {Promise} same promise
         */
        always: function(fn, fnScope) {
            this.done(fn, fnScope);
            this.fail(fn, fnScope);
            return this;
        },

        /**
         * @returns {{then: function, done: function, fail: function, always: function}}
         */
        promise: function() {
            var self = this;
            return {
                then: bind(self.then, self),
                done: bind(self.done, self),
                fail: bind(self.fail, self),
                always: bind(self.always, self)
            };
        },

        after: function(value) {

            var self = this;

            if (isThenable(value)) {

                self._wait++;

                var done = function() {
                    self._wait--;
                    if (self._wait == 0 && self._state != PENDING) {
                        self._state == FULFILLED ?
                            self._callResolveHandlers() :
                            self._callRejectHandlers();
                    }
                };

                if (isFunction(value.done)) {
                    value.done(done);
                }
                else {
                    value.then(done);
                }
            }

            return self;
        }
    };


    Promise.fcall = function(fn, context, args) {
        return Promise.resolve(fn.apply(context, args || []));
    };

    /**
     * @param {*} value
     * @returns {Promise}
     */
    Promise.resolve = function(value) {
        var p = new Promise;
        p.resolve(value);
        return p;
    };


    /**
     * @param {*} reason
     * @returns {Promise}
     */
    Promise.reject = function(reason) {
        var p = new Promise;
        p.reject(reason);
        return p;
    };


    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     */
    Promise.all = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p       = new Promise,
            len     = promises.length,
            values  = new Array(len),
            cnt     = len,
            i,
            item,
            done    = function(value, inx) {
                values[inx] = value;
                cnt--;

                if (cnt == 0) {
                    p.resolve(values);
                }
            };

        for (i = 0; i < len; i++) {

            (function(inx){
                item = promises[i];

                if (item instanceof Promise) {
                    item.done(function(value){
                        done(value, inx);
                    })
                        .fail(p.reject, p);
                }
                else if (isThenable(item) || isFunction(item)) {
                    (new Promise(item))
                        .done(function(value){
                            done(value, inx);
                        })
                        .fail(p.reject, p);
                }
                else {
                    done(item, inx);
                }
            })(i);
        }

        return p;
    };

    /**
     * @param {Promise|*} promise1
     * @param {Promise|*} promise2
     * @param {Promise|*} promiseN
     * @returns {Promise}
     */
    Promise.when = function() {
        return Promise.all(arguments);
    };

    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     */
    Promise.allResolved = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p       = new Promise,
            len     = promises.length,
            values  = [],
            cnt     = len,
            i,
            item,
            settle  = function(value) {
                values.push(value);
                proceed();
            },
            proceed = function() {
                cnt--;
                if (cnt == 0) {
                    p.resolve(values);
                }
            };

        for (i = 0; i < len; i++) {
            item = promises[i];

            if (item instanceof Promise) {
                item.done(settle).fail(proceed);
            }
            else if (isThenable(item) || isFunction(item)) {
                (new Promise(item)).done(settle).fail(proceed);
            }
            else {
                settle(item);
            }
        }

        return p;
    };

    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     */
    Promise.race = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p   = new Promise,
            len = promises.length,
            i,
            item;

        for (i = 0; i < len; i++) {
            item = promises[i];

            if (item instanceof Promise) {
                item.done(p.resolve, p).fail(p.reject, p);
            }
            else if (isThenable(item) || isFunction(item)) {
                (new Promise(item)).done(p.resolve, p).fail(p.reject, p);
            }
            else {
                p.resolve(item);
            }

            if (!p.isPending()) {
                break;
            }
        }

        return p;
    };

    /**
     * @param {[]} functions -- array of promises or resolve values or functions
     * @returns {Promise}
     */
    Promise.waterfall = function(functions) {

        if (!functions.length) {
            return Promise.resolve(null);
        }

        var first   = functions.shift(),
            promise = isFunction(first) ? Promise.fcall(first) : Promise.resolve(fn),
            fn;

        while (fn = functions.shift()) {
            if (isThenable(fn)) {
                promise = promise.then(function(fn){
                    return function(){
                        return fn;
                    };
                }(fn));
            }
            else if (isFunction(fn)) {
                promise = promise.then(fn);
            }
            else {
                promise.resolve(fn);
            }
        }

        return promise;
    };

    Promise.counter = function(cnt) {

        var promise     = new Promise;

        promise.countdown = function() {
            cnt--;
            if (cnt == 0) {
                promise.resolve();
            }
        };

        return promise;
    };

    return Promise;
}();

