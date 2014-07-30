

(function(){

    "use strict";

    var PENDING     = 0,
        FULFILLED   = 1,
        REJECTED    = 2,

        setTimeout  = typeof window != "undefined" ?
                        window.setTimeout :
                        global.setTimeout,

        isThenable  = function(any) {
            var then;
            return any && (typeof any == "object" || typeof any == "function") &&
                typeof (then = any.then) == "function" ?
                then : false;
        },

        bind        = function(fn, scope) {
            return function() {
                return fn.apply(scope, arguments);
            }
        },

        queue       = [],
        qRunning    = false,


        nextTick    = typeof process != "undefined" ?
                        process.nextTick :
                        function(fn) {
                            setTimeout(fn, 0);
                        },
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
        next        = function(fn, scope, args) {
            args = args || [];
            queue.push([fn, scope, args]);
            if (!qRunning) {
                nextInQueue();
            }
        },

        extend      = function(trg, src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    trg[i] = src[i];
                }
            }
        },

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
                throw Error("Cannot construct Promise with given value");
            }
        }
    };

    extend(Promise.prototype, {

        _state: PENDING,

        _fulfills: null,
        _rejects: null,
        _dones: null,
        _fails: null,

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


        _doResolve: function(value) {
            var self    = this;

            self._value = value;
            self._state = FULFILLED;

            var cbs  = self._fulfills,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [self._value]);
            }

            self._done();
            self._cleanup();
        },

        _processResolveValue: function(value) {
            this._processValue(value, this._doResolve);
        },

        resolve: function(value) {

            var self    = this;

            if (self._triggered) {
                return;
            }

            self._triggered = true;
            self._processResolveValue(value);
        },



        _doReject: function(reason) {

            var self        = this;

            self._state     = REJECTED;
            self._reason    = reason;

            var cbs  = self._rejects,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [reason]);
            }

            self._fail();
            self._cleanup();
        },


        _processRejectReason: function(reason) {
            this._processValue(reason, this._doReject);
        },

        reject: function(reason) {

            var self    = this;

            if (self._triggered) {
                return;
            }

            self._triggered = true;

            self._processRejectReason(reason);
        },


        then: function(resolve, reject) {

            var self            = this,
                promise         = new Promise,
                state           = self._state;

            if (state == PENDING) {

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

        done: function(fn, fnScope) {
            var self    = this,
                state   = self._state;

            if (state == PENDING) {
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

        fail: function(fn, fnScope) {

            var self    = this,
                state   = self._state;

            if (state == PENDING) {
                self._fails.push([fn, fnScope]);
            }
            else {
                fn.call(fnScope || null, self._reason);
            }

            return self;
        },

        promise: function() {
            var self = this;
            return {
                then: bind(self.then, self),
                done: bind(self.done, self),
                fail: bind(self.fail, self)
            };
        }
    });

    extend(Promise, {
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

        reject: function(reason) {
            var p = new Promise;
            p.reject(reason);
            return p;
        },

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
            window.MetaphorJs.d("MetaphorJs.lib.Promise", Promise);
        }
    }
    else {
        if (typeof module != "undefined") {
            module.exports = Promise;
        }
    }

}());