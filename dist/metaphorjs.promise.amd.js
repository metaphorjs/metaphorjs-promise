define("metaphorjs-promise", function() {
/* BUNDLE START 004 */
"use strict";

var MetaphorJsPrebuilt = {"templates":{},"templateOptions":{},"expressionOpts":{}}
MetaphorJsPrebuilt['funcs'] = {

};

/**
 * Check if given value is a function
 * @function isFunction
 * @param {*} value 
 * @returns {boolean}
 */
function isFunction(value) {
    return typeof value == 'function';
};



/**
 * Checks if given value is a thenable (a Promise)
 * @function isThenable
 * @param {*} any
 * @returns {boolean|function}
 */
function isThenable(any) {

    // any.then must only be accessed once
    // this is a promise/a+ requirement

    if (!any) { //  || !any.then
        return false;
    }
    
    var t;

    //if (!any || (!isObject(any) && !isFunction(any))) {
    if (((t = typeof any) != "object" && t != "function")) {
        return false;
    }

    var then = any.then;

    return isFunction(then) ? then : false;
};

/**
 * Bind function to context (Function.bind wrapper)
 * @function bind
 * @param {function} fn
 * @param {*} context
 * @returns {function}
 */
function bind(fn, context){
    return fn.bind(context);
};

var strUndef = "undefined";



/**
 * Log thrown error to console (in debug mode) and 
 * call all error listeners
 * @function error
 * @param {Error} e 
 */
var error = (function(){

    var listeners = [];

    var error = function error(e) {

        var i, l;

        for (i = 0, l = listeners.length; i < l; i++) {
            listeners[i][0].call(listeners[i][1], e)
        }

        /*DEBUG-START*/
        if (typeof console != strUndef && console.error) {
            console.error(e);
        }
        /*DEBUG-END*/
    };

    /**
     * Subscribe to all errors
     * @method on
     * @param {function} fn 
     * @param {object} context 
     */
    error.on = function(fn, context) {
        error.un(fn, context);
        listeners.push([fn, context]);
    };

    /**
     * Unsubscribe from all errors
     * @method un
     * @param {function} fn 
     * @param {object} context 
     */
    error.un = function(fn, context) {
        var i, l;
        for (i = 0, l = listeners.length; i < l; i++) {
            if (listeners[i][0] === fn && listeners[i][1] === context) {
                listeners.splice(i, 1);
                break;
            }
        }
    };

    return error;
}());




var MetaphorJs = {
    plugin: {},
    mixin: {},
    lib: {},
    dom: {},
    regexp: {},
    browser: {},
    app: {},
    prebuilt: typeof MetaphorJsPrebuilt !== "undefined" ? MetaphorJsPrebuilt : null
};


var undf = undefined;



/**
 * Transform anything into array
 * @function toArray
 * @param {*} list
 * @returns {array}
 */
function toArray(list) {
    if (list && !list.length != undf && list !== ""+list) {
        for(var a = [], i =- 1, l = list.length>>>0; ++i !== l; a[i] = list[i]){}
        return a;
    }
    else if (list) {
        return [list];
    }
    else {
        return [];
    }
};

/**
 * Convert anything to string
 * @function toString
 * @param {*} value
 * @returns {string}
 */
var toString = Object.prototype.toString;




var _varType = function(){

    var types = {
        '[object String]': 0,
        '[object Number]': 1,
        '[object Boolean]': 2,
        '[object Object]': 3,
        '[object Function]': 4,
        '[object Array]': 5,
        '[object RegExp]': 9,
        '[object Date]': 10
    };


    /*
     * 'string': 0,
     * 'number': 1,
     * 'boolean': 2,
     * 'object': 3,
     * 'function': 4,
     * 'array': 5,
     * 'null': 6,
     * 'undefined': 7,
     * 'NaN': 8,
     * 'regexp': 9,
     * 'date': 10,
     * unknown: -1
     * @param {*} value
     * @returns {number}
     */



    return function _varType(val) {

        if (!val) {
            if (val === null) {
                return 6;
            }
            if (val === undf) {
                return 7;
            }
        }

        var num = types[toString.call(val)];

        if (num === undf) {
            return -1;
        }

        if (num === 1 && isNaN(val)) {
            return 8;
        }

        return num;
    };

}();



/**
 * Check if given value is plain object
 * @function isPlainObject
 * @param {*} value 
 * @returns {boolean}
 */
function isPlainObject(value) {
    // IE < 9 returns [object Object] from toString(htmlElement)
    return typeof value == "object" &&
           _varType(value) === 3 &&
            !value.nodeType &&
            value.constructor === Object;
};

/**
 * Check if given value is a boolean value
 * @function isBool
 * @param {*} value 
 * @returns {boolean}
 */
function isBool(value) {
    return value === true || value === false;
};


/**
 * Copy properties from one object to another
 * @function extend
 * @param {Object} dst
 * @param {Object} src
 * @param {Object} src2 ... srcN
 * @param {boolean} override {
 *  Override already existing keys 
 *  @default false
 * }
 * @param {boolean} deep {
 *  Do not copy objects by link, deep copy by value
 *  @default false
 * }
 * @returns {object}
 */
function extend() {

    var override    = false,
        deep        = false,
        args        = toArray(arguments),
        dst         = args.shift(),
        src,
        k,
        value;

    if (isBool(args[args.length - 1])) {
        override    = args.pop();
    }
    if (isBool(args[args.length - 1])) {
        deep        = override;
        override    = args.pop();
    }

    while (args.length) {
        
        // src can be empty
        src = args.shift();
        
        if (!src) {
            continue;
        }

        for (k in src) {

            if (src.hasOwnProperty(k) && (value = src[k]) !== undf) {

                if (deep) {
                    if (dst[k] && isPlainObject(dst[k]) && isPlainObject(value)) {
                        extend(dst[k], value, override, deep);
                    }
                    else {
                        if (override === true || dst[k] == undf) { // == checks for null and undefined
                            if (isPlainObject(value)) {
                                dst[k] = {};
                                extend(dst[k], value, override, true);
                            }
                            else {
                                dst[k] = value;
                            }
                        }
                    }
                }
                else {
                    if (override === true || dst[k] == undf) {
                        dst[k] = value;
                    }
                }
            }
        }
    }

    return dst;
};





MetaphorJs.lib.Promise = function(){

    var PENDING     = 0,
        FULFILLED   = 1,
        REJECTED    = 2,
        CANCELLED   = 3,

        queue       = [],
        qRunning    = false,

        nextTick    = typeof process !== strUndef ?
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
         * @function
         * @param {Function} fn
         * @param {Object} scope
         * @param {[]} args
         * @ignore
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
         * @function
         * @param {Function} fn
         * @param {Promise} promise
         * @returns {Function}
         * @ignore
         */
        resolveWrapper     = function(fn, promise) {
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
     * @class MetaphorJs.lib.Promise
     */

    /**
     * @constructor 
     * @method Promise
     * @param {Function} fn {
     *  @description Constructor accepts two parameters: resolve and reject functions.
     *  @param {function} resolve {
     *      @param {*} value
     *  }
     *  @param {function} reject {
     *      @param {*} reason
     *  }
     * }
     * @param {Object} context
     * @returns {Promise}
     */

    /**
     * @constructor 
     * @method Promise 
     * @param {Thenable} thenable
     * @returns {Promise}
     */

    /**
     * @constructor 
     * @method Promise 
     * @param {*} value Value to resolve promise with
     * @returns {Promise}
     */

    /**
     * @constructor 
     * @method Promise 
     * @returns {Promise}
     */
    var Promise = function(fn, context) {

        if (fn instanceof Promise) {
            return fn;
        }

        if (!(this instanceof Promise)) {
            return new Promise(fn, context);
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
                    fn.call(context,
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

        /**
         * Is promise still pending (as opposed to resolved or rejected)
         * @method
         * @returns {boolean}
         */
        isPending: function() {
            return this._state === PENDING;
        },

        /**
         * Is the promise fulfilled. Same as isResolved()
         * @method
         * @returns {boolean}
         */
        isFulfilled: function() {
            return this._state === FULFILLED;
        },

        /**
         * Is the promise resolved. Same as isFulfilled()
         * @method
         * @returns {boolean}
         */
        isResolved: function() {
            return this._state === FULFILLED;
        },

        /**
         * Is the promise rejected
         * @method
         * @returns {boolean}
         */
        isRejected: function() {
            return this._state === REJECTED;
        },

        /**
         * Is the promise was destroyed before resolving or rejecting
         * @method
         * @returns {boolean}
         */
        isCancelled: function() {
            return this._state === CANCELLED;
        },

        /**
         * Did someone subscribed to this promise
         * @method
         * @returns {boolean}
         */
        hasListeners: function() {
            var self = this,
                ls  = [self._fulfills, self._rejects, self._dones, self._fails],
                i, l;

            for (i = 0, l = ls.length; i < l; i++) {
                if (ls[i] && ls[i].length) {
                    return true;
                }
            }

            return false;
        },

        _cleanup: function() {
            var self    = this;

            self._fulfills = null;
            self._rejects = null;
            self._dones = null;
            self._fails = null;
        },

        _processValue: function(value, cb, allowThenanle) {

            var self    = this,
                then;

            if (self._state !== PENDING) {
                return;
            }

            if (value === self) {
                self._doReject(new TypeError("cannot resolve promise with itself"));
                return;
            }

            if (allowThenanle) {
                try {
                    if (then = isThenable(value)) {
                        if (value instanceof Promise) {
                            value.then(
                                bind(self._processResolveValue, self),
                                bind(self._processRejectReason, self)
                            );
                        }
                        else {
                            (new Promise(then, value)).then(
                                bind(self._processResolveValue, self),
                                bind(self._processRejectReason, self)
                            );
                        }
                        return;
                    }
                }
                catch (thrownError) {
                    if (self._state === PENDING) {
                        self._doReject(thrownError);
                    }
                    return;
                }
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

            if (self._wait === 0) {
                self._callResolveHandlers();
            }
        },

        _processResolveValue: function(value) {
            this._processValue(value, this._doResolve, true);
        },

        /**
         * Resolve the promise
         * @method
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

            if (self._wait === 0) {
                self._callRejectHandlers();
            }
        },


        _processRejectReason: function(reason) {
            this._processValue(reason, this._doReject, false);
        },

        /**
         * Reject the promise
         * @method
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
         * @method
         * @async
         * @param {Function} resolve -- called when this promise is resolved; 
         *  returns new resolve value or promise
         * @param {Function} reject -- called when this promise is rejected; 
         *  returns new reject reason
         * @param {object} context -- resolve's and reject's functions "this" object
         * @returns {Promise} new promise
         */
        then: function(resolve, reject, context) {

            var self            = this,
                promise         = new Promise,
                state           = self._state;

            if (context) {
                if (resolve) {
                    resolve = bind(resolve, context);
                }
                if (reject) {
                    reject = bind(reject, context);
                }
            }

            if (state === PENDING || self._wait !== 0) {

                if (resolve && isFunction(resolve)) {
                    self._fulfills.push([resolveWrapper(resolve, promise), null]);
                }
                else {
                    self._fulfills.push([promise.resolve, promise])
                }

                if (reject && isFunction(reject)) {
                    self._rejects.push([resolveWrapper(reject, promise), null]);
                }
                else {
                    self._rejects.push([promise.reject, promise]);
                }
            }
            else if (state === FULFILLED) {

                if (resolve && isFunction(resolve)) {
                    next(resolveWrapper(resolve, promise), null, [self._value]);
                }
                else {
                    promise.resolve(self._value);
                }
            }
            else if (state === REJECTED) {
                if (reject && isFunction(reject)) {
                    next(resolveWrapper(reject, promise), null, [self._reason]);
                }
                else {
                    promise.reject(self._reason);
                }
            }

            return promise;
        },

        /**
         * Add reject listener.
         * @method
         * @async
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
         * Add resolve listener
         * @method
         * @sync
         * @param {Function} fn -- function to call when promise is resolved
         * @param {Object} context -- function's "this" object
         * @returns {Promise} same promise
         */
        done: function(fn, context) {
            var self    = this,
                state   = self._state;

            if (state === FULFILLED && self._wait === 0) {
                try {
                    fn.call(context || null, self._value);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state === PENDING) {
                self._dones.push([fn, context]);
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
         * Add reject listener
         * @method
         * @sync
         * @param {Function} fn -- function to call when promise is rejected.
         * @param {Object} context -- function's "this" object
         * @returns {Promise} same promise
         */
        fail: function(fn, context) {

            var self    = this,
                state   = self._state;

            if (state === REJECTED && self._wait === 0) {
                try {
                    fn.call(context || null, self._reason);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state === PENDING) {
                self._fails.push([fn, context]);
            }

            return self;
        },

        /**
         * Add both resolve and reject listener
         * @method
         * @sync
         * @param {Function} fn -- function to call when promise resolved or rejected
         * @param {Object} context -- function's "this" object
         * @return {Promise} same promise
         */
        always: function(fn, context) {
            this.done(fn, context);
            this.fail(fn, context);
            return this;
        },

        /**
         * Get a thenable object
         * @method
         * @returns {object} then: function, done: function, fail: function, always: function
         */
        promise: function() {
            var self = this;
            return {
                then: bind(self.then, self),
                done: bind(self.done, self),
                fail: bind(self.fail, self),
                always: bind(self.always, self),
                "catch": bind(self['catch'], self)
            };
        },

        /**
         * Resolve this promise after <code>value</code> promise is resolved.
         * @method
         * @param {*|Promise} value
         * @returns {Promise} self
         */
        after: function(value) {

            var self = this;

            if (isThenable(value)) {

                self._wait++;

                var done = function() {
                    self._wait--;
                    if (self._wait === 0 && self._state !== PENDING) {
                        self._state === FULFILLED ?
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
        },

        $destroy: function() {
            this._cleanup();
            this._state === PENDING && (this._state = CANCELLED);
        }
    }, true, false);


    /**
     * Call function <code>fn</code> with given args in given context
     * and use its return value as resolve value for a new promise.
     * Then return this promise.
     * @static
     * @method
     * @param {function} fn
     * @param {object} context
     * @param {[]} args
     * @returns {Promise}
     */
    Promise.fcall = function(fn, context, args) {
        return Promise.resolve(fn.apply(context, args || []));
    };

    /**
     * Create new promise and resolve it with given value
     * @static
     * @method
     * @param {*} value
     * @returns {Promise}
     */
    Promise.resolve = function(value) {
        var p = new Promise;
        p.resolve(value);
        return p;
    };


    /**
     * Create new promise and reject it with given reason
     * @static
     * @method
     * @param {*} reason
     * @returns {Promise}
     */
    Promise.reject = function(reason) {
        var p = new Promise;
        p.reject(reason);
        return p;
    };


    /**
     * Take a list of promises or values and once all promises are resolved,
     * create a new promise and resolve it with a list of final values.<br>
     * If one of the promises is rejected, it will reject the returned promise.
     * @static
     * @method
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

                if (cnt === 0) {
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
     * Same as <code>all()</code> but it treats arguments as list of values.
     * @static
     * @method
     * @param {Promise|*} promise1
     * @param {Promise|*} promise2
     * @param {Promise|*} promiseN
     * @returns {Promise}
     */
    Promise.when = function() {
        return Promise.all(arguments);
    };

    /**
     * Same as <code>all()</code> but the resulting promise
     * will not be rejected if ones of the passed promises is rejected.
     * @static
     * @method
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
                if (cnt === 0) {
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
     * Given the list of promises or values it will return a new promise
     * and resolve it with the first resolved value.
     * @static
     * @method
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
     * Takes a list of async functions and executes 
     * them in given order consequentially
     * @static
     * @method
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

    /**
     * Works like Array.forEach but it expects passed function to 
     * return a Promise.
     * @static
     * @method 
     * @param {array} items 
     * @param {function} fn {
     *  @param {*} value
     *  @param {int} index
     *  @returns {Promise|*}
     * }
     * @param {object} context 
     * @param {boolean} allResolved if true, the resulting promise
     * will fail if one of the returned promises fails.
     */
    Promise.forEach = function(items, fn, context, allResolved) {

        var left = items.slice(),
            p = new Promise,
            values = [],
            i = 0;

        var next = function() {

            if (!left.length) {
                p.resolve(values);
                return;
            }

            var item = left.shift(),
                index = i;

            i++;

            Promise.fcall(fn, context, [item, index])
                .done(function(result){
                    values.push(result);
                    next();
                })
                .fail(function(reason){
                    if (allResolved) {
                        p.reject(reason);
                    }
                    else {
                        values.push(null);
                        next();
                    }
                });
        };

        next();

        return p;
    };

    /**
     * Returns a promise with additional <code>countdown</code>
     * method. Call this method <code>cnt</code> times and
     * the promise will get resolved.
     * @static
     * @method
     * @param {int} cnt 
     * @returns {Promise}
     */
    Promise.counter = function(cnt) {

        var promise     = new Promise;

        promise.countdown = function() {
            cnt--;
            if (cnt === 0) {
                promise.resolve();
            }
        };

        return promise;
    };

    return Promise;
}();


return MetaphorJs.lib.Promise;
});

/* BUNDLE END 004 */