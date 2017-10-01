
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter;

var EventEmitter2 = require('../../lib/eventemitter2').EventEmitter2;
var emitter2 = new EventEmitter2();

var emitter2wild = new EventEmitter2({wildcard: true});

function foo() {
  return true;
}

suite

  .add('EventEmitterHeatUp', function() {

    emitter.on('test3', foo);
    emitter.emit('test3');
    emitter.removeAllListeners('test3');

  })
  .add('EventEmitter', function() {

    emitter.on('test1', foo);
    emitter.emit('test1');
    emitter.removeAllListeners('test1');

  })
  .add('EventEmitter2', function() {

    emitter2.on('test2', foo);
    emitter2.emit('test2');
    emitter2.removeAllListeners('test2');

  })

  .add('EventEmitter2 (wild)', function() {

    emitter2wild.on('test2.foo', foo);
    emitter2wild.emit('test2.foo');
    emitter2wild.removeAllListeners('test2.foo');

  })

  .on('cycle', function(event, bench) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\nFastest is ' + this.filter('fastest').map((n) => n.name));
  })

  .run(true);
