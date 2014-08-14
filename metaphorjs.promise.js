

(function(){

    "use strict";

    var PENDING     = 0,
        FULFILLED   = 1,
        REJECTED    = 2,

        setTimeout  = typeof window != "undefined" ?
                        window.setTimeout :
                        global.setTimeout,

        /**
         * @param {*} any
         * @returns {Function|bool}
         */
        isThenable  = function(any) {
            var then;
            return any && (typeof any == "object" || typeof any == "function") &&
                typeof (then = any.then) == "function" ?
                then : false;
        },

        /**
         * @param {Function} fn
         * @param {Object} scope
         * @returns {Function}
         */
        bind        = Function.prototype.bind ?
                      function(fn, fnScope){
                          return fn.bind(fnScope);
                      } :
                      function(fn, fnScope) {
                          return function() {
                              fn.apply(fnScope, arguments);
                          };
                      },

        queue       = [],
        qRunning    = false,


        nextTick    = typeof process != "undefined" ?
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
         * Extend trg object with properties from src
         * @param {Object} trg
         * @param {Object} src
         */
        extend      = function(trg, src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    trg[i] = src[i];
                }
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
                catch (e) {
                    promise.reject(e);
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

        var self = this;

        self._fulfills   = [];
        self._rejects    = [];
        self._dones      = [];
        self._fails      = [];

        if (fn) {

            if (isThenable(fn)) {
                self.resolve(fn);
            }
            else if (typeof fn == "function") {
                try {
                    fn.call(fnScope,
                            bind(self.resolve, self),
                            bind(self.reject, self));
                }
                catch (e) {
                    self.reject(e);
                }
            }
            else {
                throw "Cannot construct Promise with given value";
            }
        }
    };

    extend(Promise.prototype, {

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
            catch (e) {
                if (self._state == PENDING) {
                    self._doReject(e);
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

                if (resolve && typeof resolve == "function") {
                    self._fulfills.push([wrapper(resolve, promise), null]);
                }
                else {
                    self._fulfills.push([promise.resolve, promise])
                }

                if (reject && typeof reject == "function") {
                    self._rejects.push([wrapper(reject, promise), null]);
                }
                else {
                    self._rejects.push([promise.reject, promise]);
                }
            }
            else if (state == FULFILLED) {

                if (resolve && typeof resolve == "function") {
                    next(wrapper(resolve, promise), null, [self._value]);
                }
                else {
                    promise.resolve(self._value);
                }
            }
            else if (state == REJECTED) {
                if (reject && typeof reject == "function") {
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
                cb[0].call(cb[1] || null, self._value);
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

            if (state == PENDING || self._wait != 0) {
                self._dones.push([fn, fnScope]);
            }
            else {
                fn.call(fnScope || null, self._value);
            }

            return self;
        },

        _fail: function() {

            var self    = this,
                cbs     = self._fails,
                cb;

            while (cb = cbs.shift()) {
                cb[0].call(cb[1] || null, self._reason);
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

            if (state == PENDING || self._wait != 0) {
                self._fails.push([fn, fnScope]);
            }
            else {
                fn.call(fnScope || null, self._reason);
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

                if (typeof value.done == "function") {
                    value.done(done);
                }
                else {
                    value.then(done);
                }
            }

            return self;
        }
    });

    extend(Promise, {

        /**
         * @param {*} value
         * @returns {Promise}
         */
        resolve: function(value) {
            if (isThenable(value) || typeof value == "function") {
                return new Promise(value);
            }
            else {
                var p = new Promise;
                p.resolve(value);
                return p;
            }
        },

        /**
         * @param {*} reason
         * @returns {Promise}
         */
        reject: function(reason) {
            var p = new Promise;
            p.reject(reason);
            return p;
        },

        /**
         * @param {[]} promises -- array of promises or resolve values
         * @returns {Promise}
         */
        all: function(promises) {

            if (!promises.length) {
                return Promise.resolve(null);
            }

            var p       = new Promise,
                len     = promises.length,
                values  = [],
                cnt     = len,
                i,
                item,
                done    = function(value) {
                    values.push(value);
                    cnt--;

                    if (cnt == 0) {
                        p.resolve(values);
                    }
                };

            for (i = 0; i < len; i++) {
                item = promises[i];

                if (item instanceof Promise) {
                    item.done(done).fail(p.reject, p);
                }
                else if (isThenable(item) || typeof item == "function") {
                    (new Promise(item)).done(done).fail(p.reject, p);
                }
                else {
                    done(item);
                }
            }

            return p;
        },

        /**
         * @param {Promise|*} promise1
         * @param {Promise|*} promise2
         * @param {Promise|*} promiseN
         * @returns {Promise}
         */
        when: function() {
            return Promise.all(arguments);
        },

        /**
         * @param {[]} promises -- array of promises or resolve values
         * @returns {Promise}
         */
        allResolved: function(promises) {

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
                else if (isThenable(item) || typeof item == "function") {
                    (new Promise(item)).done(settle).fail(proceed);
                }
                else {
                    settle(item);
                }
            }

            return p;
        },

        /**
         * @param {[]} promises -- array of promises or resolve values
         * @returns {Promise}
         */
        race: function(promises) {

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
                else if (isThenable(item) || typeof item == "function") {
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
        }
    });

    if (typeof global == "undefined") {
        if (!window.Promise) {
            window.Promise = Promise;
        }
        if (window.MetaphorJs) {
            window.MetaphorJs.r("MetaphorJs.lib.Promise", Promise);
        }
    }
    else {
        if (typeof module != "undefined") {
            module.exports = Promise;
        }
    }

}());