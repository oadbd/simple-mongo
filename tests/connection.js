require.paths.unshift('/usr/local/lib/node');

var simple = require('../lib/simple-mongo');
var util = require('util');

//var db = simple.connect('pfit', 'localhost', 27017, {});
//db.open(function (err, db) {
//   console.log('in open'); 
//   db.close();
//});

simple.configure({
    db: 'pfit',
    objectids: false
});


var qee = simple.query('workouts');
qee.on('end', function () {
    console.log('gotted');
}).find({});

//qee.get('2010-01-01');
/*
qee.client.open(function (err, db) {
    console.log('in open');
    console.log(err);
    db.close();
});
*/
/*
qee.on('result', function (doc) {
    console.log('result = ' + doc);
}).on('end', function () {
    console.log('in end');
}).on('error', function (err) {
    console.log('in error');
    console.log(util.inspect(err));
}).find({});
*/

//console.log(util.inspect(qee));