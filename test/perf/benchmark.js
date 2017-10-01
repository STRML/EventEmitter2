
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter;

var EventEmitter2 = require('../../lib/eventemitter2').EventEmitter2;
var emitter2 = new EventEmitter2;

var EventEmitter3 = require('events').EventEmitter;
var emitter3 = new EventEmitter3;

function foo() {
  return true;
}

suite

  .add('EventEmitterHeatUp', function() {

      emitter3.on('test3', foo);
      emitter3.emit('test3');
      emitter3.removeAllListeners('test3');

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

    emitter2.on('test2.foo', foo);
    emitter2.emit('test2.foo');
    emitter2.removeAllListeners('test2.foo');

  })

  .on('cycle', function(event, bench) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\nFastest is ' + this.filter('fastest').map((n) => n.name));
  })

  .run(true);
