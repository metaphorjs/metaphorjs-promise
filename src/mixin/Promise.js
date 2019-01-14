require("../lib/Promise.js");

var MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

/**
 * @mixin MetaphorJs.mixin.Promise
 */
module.exports = MetaphorJs.mixin.Promise = {

    $$promise: null,

    $beforeInit: function() {
        this.$$promise = new MetaphorJs.lib.Promise;
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
    then: function() {
        return this.$$promise.then.apply(this.$$promise, arguments);
    },

    /**
     * Add resolve listener
     * @method
     * @sync
     * @param {Function} fn -- function to call when promise is resolved
     * @param {Object} context -- function's "this" object
     * @returns {Promise} same promise
     */
    done: function() {
        this.$$promise.done.apply(this.$$promise, arguments);
        return this;
    },

    /**
     * Add both resolve and reject listener
     * @method
     * @sync
     * @param {Function} fn -- function to call when promise resolved or rejected
     * @param {Object} context -- function's "this" object
     * @return {Promise} same promise
     */
    always: function() {
        this.$$promise.always.apply(this.$$promise, arguments);
        return this;
    },

    /**
     * Add reject listener
     * @method
     * @sync
     * @param {Function} fn -- function to call when promise is rejected.
     * @param {Object} context -- function's "this" object
     * @returns {Promise} same promise
     */
    fail: function() {
        this.$$promise.fail.apply(this.$$promise, arguments);
        return this;
    }

};