
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

// BenchmarkJS is really strange
const EventEmitter2 = global.EventEmitter2 = require('../../lib/eventemitter2').EventEmitter2;
const foo = global.foo = function foo() {
  return true;
};

let emitter;
suite
  // .add('EventEmitter2 (many wilds)', {
  //   setup() {
  //     emitter = new EventEmitter2();
  //   },
  //   teardown() {
  //     emitter.removeAllListeners();
  //   },
  //   fn() {
  //     emitter.setMaxListeners(Infinity);
  //     emitter.on('test2.foo', foo);
  //     emitter.on('test2.*', foo);
  //     emitter.on('*.*', foo);
  //     emitter.on('**', foo);
  //     emitter.emit('test2.foo');
  //   }
  // })

  .add('EventEmitter2 (remove after adding many)', {
    setup() {
      emitter = new EventEmitter2({
        wildcard: true
      });
      emitter.setMaxListeners(Infinity);
      for (let i = 0; i < 1000; i++) {
        emitter.on('test2.foo', foo);
        emitter.on('test2.*', foo);
        emitter.on('*.*', foo);
        emitter.on('**', foo);
      }
    },
    teardown() {
      emitter.removeAllListeners();
    },
    fn() {
      emitter.removeListener('*.*', foo);
      emitter.removeAllListeners('test2.foo');
    }
  })

  .add('EventEmitter2 (remove after adding many, deep)', {
    setup() {
      emitter = new EventEmitter2({
        wildcard: true
      });
      emitter.setMaxListeners(Infinity);
      for (let i = 0; i < 1000; i++) {
        emitter.on('test2.foo.bar.baz.biff', foo);
        emitter.on('test2.*', foo);
        emitter.on('*.*', foo);
        emitter.on('**', foo);
      }
    },
    teardown() {
      emitter.removeAllListeners();
    },
    fn() {
      emitter.emit('test2.foo.bar.baz.biff');
      emitter.removeListener('test2.foo.bar.baz.biff', foo);
      emitter.removeAllListeners('test2.foo');
    }
  })

  .add('EventEmitter2 (remove after adding many, deep wildcards)', {
    setup() {
      emitter = new EventEmitter2({
        wildcard: true
      });
      emitter.setMaxListeners(Infinity);
      for (let i = 0; i < 1000; i++) {
        emitter.on('test2.*.*.*.*', foo);
        emitter.on('test2.*', foo);
        emitter.on('*.*', foo);
        emitter.on('**', foo);
      }
    },
    teardown() {
      emitter.removeAllListeners();
    },
    fn() {
      emitter.emit('test2.foo.bar.baz.biff');
      emitter.removeListener('test2.*.*.*.*', foo);
      emitter.removeAllListeners('test2.foo');
    }
  })

  .add('EventEmitter2 (remove after adding many, double wildcard)', {
    setup() {
      emitter = new EventEmitter2({
        wildcard: true
      });
      emitter.setMaxListeners(Infinity);
      for (let i = 0; i < 1000; i++) {
        emitter.on('test2.**', foo);
        emitter.on('test2.*', foo);
        emitter.on('*.*', foo);
        emitter.on('**', foo);
      }
    },
    teardown() {
      emitter.removeAllListeners();
    },
    fn() {
      emitter.emit('test2.foo.bar.baz.biff');
      emitter.removeListener('test2.**', foo);
      emitter.removeAllListeners('test2.foo');
    }
  })

  .on('cycle', function(event, bench) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\nFastest is ' + this.filter('fastest').map((n) => n.name));
  })
  .on('error', console.error)

  .run(true);
