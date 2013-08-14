var request = require('request');

module.exports = RestResoure;

/**
 * Build a REST resource client for CRUD operations
 * @param {function} modelCtor The model constructor
 * @param {string} baseUrl The base URL
 * @returns {RestResoure}
 * @constructor
 */
function RestResoure(pluralModelName, baseUrl) {
    if (!this instanceof RestResoure) {
        return new RestResoure(pluralModelName, baseUrl);
    }
    if (baseUrl.charAt(baseUrl.length - 1) === '/') {
        this._url = baseUrl + pluralModelName;
    } else {
        this._url = baseUrl + '/' + pluralModelName;
    }
}

/**
 * Enable/disable debug
 * @param {boolean} enabled
 */
RestResoure.prototype.debug = function (enabled) {
    this._debug = enabled;
};

RestResoure.prototype._req = function (obj) {
    if (this._debug) {
        console.dir(obj);
    }
    return obj;
};

/**
 * Wrap the callback so that it takes (err, result, response)
 * @param {function} cb The callback function
 * @returns {*}
 */
function wrap(cb) {
    var callback = cb;
    if (cb) {
        callback = function (err, response, body) {
            return cb(err, body, response);
        };
    }
    return callback;
}

/**
 * Map the create operation to HTTP POST /{model}
 * @param {object} obj The HTTP body
 * @param {function} [cb] The callback function
 */
RestResoure.prototype.create = function (obj, cb) {
    request(
        this._req({
            method: 'POST',
            uri: this._url,
            json: true,
            body: obj
        }),
        wrap(cb)
    );
};

/**
 * Map the update operation to POST /{model}/{id}
 * @param {*} id The id value
 * @param {object} obj The HTTP body
 * @param {function} [cb] The callback function
 */
RestResoure.prototype.update = function (id, obj, cb) {
    request(
        this._req({
            method: 'PUT',
            uri: this._url + '/' + id,
            json: true,
            body: obj
        }),
        wrap(cb)
    );
};

/**
 * Map the delete operation to POST /{model}/{id}
 * @param {*} id The id value
 * @param {function} [cb] The callback function
 */
RestResoure.prototype.delete = function (id, cb) {
    request(
        this._req({
            method: 'DELETE',
            uri: this._url + '/' + id,
            json: true
        }),
        wrap(cb)
    );
};

/**
 * Map the delete operation to POST /{model}
 * @param {*} id The id value
 * @param {function} [cb] The callback function
 */
RestResoure.prototype.deleteAll = function (cb) {
    request(
        this._req({
            method: 'DELETE',
            uri: this._url,
            json: true
        }),
        wrap(cb)
    );
};

/**
 * Map the find operation to GET /{model}/{id}
 * @param {*} id The id value
 * @param {function} [cb] The callback function
 */
RestResoure.prototype.find = function (id, cb) {
    request(
        this._req({
            method: 'GET',
            uri: this._url + '/' + id,
            json: true
        }),
        wrap(cb)
    );
};

/**
 * Map the all/query operation to GET /{model}
 * @param {object} q query string
 * @param {function} [cb] callback with (err, results)
 */
RestResoure.prototype.all = RestResoure.prototype.query = function (q, cb) {
    q = q || {};
    if (!cb && typeof q === 'function') {
        cb = q;
        q = {};
    }
    request(
        this._req({
            method: 'GET',
            uri: this._url,
            json: true,
            qs: q
        }),
        wrap(cb)
    );
};


var RequestBuilder = require('./rest-builder');

function defineFunctions() {
    var spec = require('./rest-crud.json');


    var functions = {};
    spec.operations.forEach(function (op) {
        if (!op.template) {
            throw new Error('The operation template is missing: ', op);
        }
        var builder = RequestBuilder.compile(op.template);
        builder.debug(spec.debug);

        // Bind all the functions to the template
        var functions = op.functions;
        if (functions) {
            for (var f in functions) {
                if (spec.debug) {
                    console.log('Mixing in method: ', f, functions[f]);
                }
                var fn = builder.operation(functions[f]);
                functions[f] = fn;
            }
        }
    });
    return functions;
}


