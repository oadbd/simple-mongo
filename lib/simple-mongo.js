var mongoDB = require('mongodb'),
    QueryEventEmitter = require('./QueryEventEmitter');


var global_config = {
    db: null,
    host: 'localhost',
    port: mongoDB.Connection.DEFAULT_PORT,
    options : {},
    objectids : true
};

var connect = exports.connect = function (db, host, port, options) {
    var opts = options || {};
    return new mongoDB.Db(db, new mongoDB.Server(host, port, opts), {});
};

var value = function (value, default_value) {
    return value === undefined ? default_value : value;
};

exports.configure = function (config) {
    global_config.db = value(config.db, global_config.db);
    global_config.host = value(config.host, global_config.host);
    global_config.port = value(config.port, global_config.port);
    global_config.options = value(config.options, global_config.options);
    global_config.objectids = value(config.objectids, global_config.objectids);
};

exports.query = function (config, collection) {
    var cfg = config;
    var col = collection;
    if (typeof config === 'string') {
        col = config;
        cfg = global_config;
    }
    var client = connect(cfg.db, cfg.host, cfg.port, cfg.options);
    return new QueryEventEmitter(client, col, cfg);
};
