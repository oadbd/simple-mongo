var events = require('events'),
    util = require('util'),
    mongoDB = require('mongodb');


/* 
 * A helper function to clean up the flow of code when dealing with the mongodb api.
 * If err is set, the QueryEventEmitter's error event will be fired, and the mongodb
 * connection will be closed.
 * Returns true if err is falsey, otherwise the error event is emitted and false is returned.
 */
var canProceed = function (qee, err) {
    var noError = true;
    if (err) {
        qee.error(err);
        qee.client.close();
        noError = false;
    }
    return noError;
};

/*
 * A helper function to reduce the callback depth in the actual implementation code.
 * A client connection is opened, and the collection is set. 
 * Any errors while opening a connection are handled using the canProceed helper function 
 * and the callback will not be called.
 */
var openAndSetCollection = function (qee, callback) {
    qee.client.open(function(err, client) {
        if (canProceed(qee, err)) client.collection(qee.collection, callback);
    });
};

/*
 * A helper function which will append the clalback to the argumentsObj
 * to allow all mongodb arguments to be used for the appropiate function.
 * For example, the mongodb collection.find arguments can still be passed in.
 */  
var argsWithCallback = function (argumentsObj, callback) {
    var args = Array.prototype.slice.call(argumentsObj);
    args.push(callback);
    return args;
};

/**
 * Simplifies the mongodb api to make for a cleaner api using events
 * instead of deeply nested callbacks. 
 *
 * Inherits from events.EventEmitter.
 * Events:
 *     result: A document returned from mongodb
 *     end: No more documents will be returned (no data is passed along with the end event)
 *     error: The error that occured, no other events will be emitted after this
 */
function QueryEventEmitter(client, collection, config) {
    events.EventEmitter.call(this);
    var qee = this;
    
    var cfg = config || {};
    
    this.client = client;
    this.collection = collection;
    this.objectids = cfg.objectids === undefined ? true : cfg.objectids;
    
    client.on('error', function (err) {
        qee.error(err);    
    });
}
util.inherits(QueryEventEmitter, events.EventEmitter);

/**
 * Emits the 'result' event with the passed in parameter
 * @param result {object} the object to emit with the event
 * @returns this QueryEventEmitter
 */ 
QueryEventEmitter.prototype.result = function (result) {
    this.emit('result', result);
    return this;
};

/**
 * Emits the 'error' event with the passed in parameter
 * @param err {object} the object to emit with the event
 * @returns this QueryEventEmitter
 */
QueryEventEmitter.prototype.error = function (err) {
    this.emit('error', err);  
    return this;
};

/**
 * Emits the 'end' event with the passed in parameter
 * @param data {object} the object to emit with the event
 * @returns this QueryEventEmitter
 */
QueryEventEmitter.prototype.end = function (data) {
    this.client.close();
    this.emit('end', data);  
    return this;
};

/**
 * Does a find using the parameters provided.
 * See the mongodb collection.find documentation for possible arguments
 * Emits 'result' for each document found
 * @returns this QueryEventEmitter
 */
QueryEventEmitter.prototype.find = function () {
    var qee = this, findArguments = arguments;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            collection.find.apply(collection, argsWithCallback(findArguments, function (err, cursor) {                
                if (canProceed(qee, err)) {
                    cursor.each(function (err, item) {
                        if (canProceed(qee, err)) {
                            if (item != null) {
                                qee.result(item);
                            } else {
                                qee.end();
                            }
                        }
                    });
                }
            }));
        }
    });
    return this;
};

/**
 * Inserts a document into the specified collection
 * Emits 'result' with the newly created document
 * @param doc {object} the document to insert
 * @returns this QueryEventEmitter
 */
QueryEventEmitter.prototype.insert = function (doc) {
    var qee = this;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            collection.insert(doc, function (err, item) {
                if (canProceed(qee, err)) {
                    qee.result(item);
                    qee.end();
                }
            });
        }
    });
    return this;
};

/*
 * Gets a document matching the specified id.
 * Emits 'result' with the found document.
 * @param id {ObjectID} an object id, or string represting an ObjectID if objectids is true
 * @returns this QueryEventEmitter
 */
QueryEventEmitter.prototype.get = function (id) {
    var qee = this;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            var qId = qee.objectids ? mongoDB.ObjectID(id) : id;
            collection.findOne({'_id': qId}, function (err, item) {
                if (canProceed(qee, err)) {
                    qee.result(item);
                    qee.end();
                }
            });
        }
    });
    return this;
};

/**
 * Updates the provided document with the matching the '_id'
 * Emits 'result' with the updated document
 * @param doc {object} the document to update
 * @returns this QueryEventEmitter
 */ 
QueryEventEmitter.prototype.update = function (doc) {
    var qee = this;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            collection.update({'_id': doc._id}, doc, function (err, item) {
                if (canProceed(qee, err)) {
                    qee.result(item);
                    qee.end();
                }
            });
        }
    });
    return this;
};

/**
 * Removes the document matching the provided id
 * Emits 'end' only
 * @param id {ObjectID} an object id, or string represting an ObjectID if objectids is true
 * @returns this QueryEventEmitter
 */
 QueryEventEmitter.prototype.remove = function (id) {
    var qee = this;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            var qId = qee.objectids ? mongoDB.ObjectID(id) : id;
            collection.remove({_id: qId}, function (err, collection) {
                if (canProceed(qee, err)) {
                    qee.end();
                }
            });
        }
    });
    return this;
};

/*
QueryEventEmitter.prototype.collection = function (callback) {
    openAndSetCollection(this, callback);
    return this;
};
*/

module.exports = QueryEventEmitter;
