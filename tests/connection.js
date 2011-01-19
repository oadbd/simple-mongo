require.paths.unshift('/usr/local/lib/node');

var simple = require('../lib/simple-mongo');
var util = require('util');


simple.configure({
    db: 'pfit',
    objectids: false
});


var qee = simple.query('workouts');
qee.on('end', function () {
    console.log('gotted');
}).on('error', function (err) {
    console.log('error');
    console.log(err);
}).find({});

simple.query('workouts').on('result', function (doc) {
    console.log('result = ' + doc);
}).on('end', function () {
    console.log('in end');
}).on('error', function (err) {
    console.log('in error');
    console.log(util.inspect(err));
}).find({});

