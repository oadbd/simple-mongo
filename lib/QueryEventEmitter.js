var events = require('events'),
    util = require('util'),
    mongoDB = require('mongodb');


var canProceed = function (qee, err) {
    var noError = true;
    if (err) {
        qee.error(err);
        qee.client.close();
        noError = false;
    }
    return noError;
};

var openAndSetCollection = function (qee, callback) {
    qee.client.open(function(err, client) {
        if (canProceed(qee, err)) client.collection(qee.collection, callback);
    });
};

var argsWithCallback = function (argumentsObj, callback) {
    var args = Array.prototype.slice.call(argumentsObj);
    args.push(callback);
    return args;
};

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

QueryEventEmitter.prototype.result = function (result) {
    this.emit('result', result);
    return this;
};

QueryEventEmitter.prototype.error = function (err) {
    this.emit('error', err);  
    return this;
};

QueryEventEmitter.prototype.end = function (data) {
    this.client.close();
    this.emit('end', data);  
    return this;
};

QueryEventEmitter.prototype.find = function () {
    var qee = this, findArguments = arguments;
    openAndSetCollection(this, function (err, collection) {
        if (canProceed(qee, err)) {
            collection.find.apply(collection, argsWithCallback(findArguments, function (err, cursor) {                
                console.log('ready to find');
                console.log(err);
                console.log(cursor);
                if (canProceed(qee, err)) {
                    try {
                    cursor.each(function (err, item) {
                        if (canProceed(qee, err)) {
                            if (item != null) {
                                qee.result(item);
                            } else {
                                qee.end();
                            }
                        }
                    });
                    } catch (e) { 
                        console.log('error caught'); 
                        console.log(e);
                        qee.end();
                    }
                }
            }));
        }
    });
    return this;
};

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
