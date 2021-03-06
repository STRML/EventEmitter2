var simpleEvents= require('nodeunit').testCase;
var file = '../../lib/eventemitter2';

var EventEmitter2;

if(typeof require !== 'undefined') {
  EventEmitter2 = require(file).EventEmitter2;
}
else {
  EventEmitter2 = window.EventEmitter2;
}

module.exports = simpleEvents({

  '1. add a single event and then remove the event.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should only have 1');

    //remove
    emitter.removeListener(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 0, 'should be 0');

    test.expect(2);
    test.done();
  },

  '2. Add two events and then remove only one of those events.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function f() {
      test.ok(true, 'event was raised');
    };

    emitter.on(type, f);
    emitter.on(type, f);

    listeners = emitter.listeners(type);
    test.equal(listeners.length, 2, 'should only have 2');

    emitter.removeListener(type, f);

    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should be 1');

    test.expect(2);
    test.done();
  },

  '3. Add three events and remove only one of the events that was added.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type, f);
    emitter.on(type, f);
    emitter.on(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 3, 'should only have 3');

    //remove
    emitter.removeListener(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 2, 'should be 2');

    test.expect(2);
    test.done();
  },

  '4. Should error if we don\'t pass a function to the emit method.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should only have 1');

    //remove
    test.throws(function () {emitter.removeListener(type, type)}, Error, 'should throw an Error');
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should be 1');

    test.expect(3);
    test.done();
  },

  '5. Removing one listener should not affect another listener.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };
    var g = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should only have 1');

    //remove
    emitter.removeListener(type, g);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 1, 'should be 1');

    test.expect(2);
    test.done();
  },

  '6. Remove all listener functions.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };
    for (var i = 0; i < 10; i++) {
      emitter.on(type, f);
    }

    listeners = emitter.listeners(type);
    test.equal(listeners.length, 10, 'should only have 10');

    emitter.removeListener(type, f);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 9, 'should be 9');
    emitter.removeAllListeners(type);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 0, 'should be 0');

    test.expect(3);
    test.done();
  },

  '7. Removing listeners for one event should not affect another event\'s listeners.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type = 'remove.foo.bar';

    var listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    for (var i = 0; i < 10; i++) {
      emitter.on(type, f);
    }

    listeners = emitter.listeners(type);
    test.equal(listeners.length, 10, 'should only have 10');

    emitter.removeListener(type+type, f);

    listeners = emitter.listeners(type);
    test.equal(listeners.length, 10, 'should be 10');

    emitter.removeAllListeners(type+type);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 10, 'should be 10');

    emitter.removeAllListeners(type+'.'+type);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 10, 'should be 10');

    emitter.removeAllListeners(type);
    listeners = emitter.listeners(type);
    test.equal(listeners.length, 0, 'should be 0');

    test.expect(5);
    test.done();
  },

  '8. Its ok to listen on wildcard, so it is ok to remove it.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type1 = '*.wild.card',
        type2 = 'just.another.event',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type2, f);
    emitter.on(type1, f);

    //remove
    emitter.removeListener(type1, f);
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 0, 'should be 0');

    test.equal(Object.keys(emitter.listenerTree).length, 1, 'should be 1');
    test.equal(emitter.listenerTree.just.another.event._listeners.length, 1, 'should be 1');
    test.equal(emitter.listeners(type2).length, 1, 'should be 1');

    test.expect(4);
    test.done();
  },

  '9. And (8) should not depend on order of listening.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type1 = '*.wild.card',
        type2 = 'just.another.event',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type1, f);
    emitter.on(type2, f);

    //remove
    emitter.removeListener(type1, f);
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 0, 'should be 0');

    test.equal(Object.keys(emitter.listenerTree).length, 1, 'should be 1');
    test.equal(emitter.listenerTree.just.another.event._listeners.length, 1, 'should be 1');
    test.equal(emitter.listeners(type2).length, 1, 'should be 1');

    test.expect(4);
    test.done();
  },

  '10. Reporting many listeners on wildcard all should removed.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type1 = '*.wild.card',
        type2 = 'exact.wild.card',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type1, f);
    emitter.on(type2, f);

    // check number of listeners by wild card
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 2, 'should only have 2');

    // remove by wild card should remove both
    emitter.removeListener(type1, f);
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 0, 'should be 0');
    test.equal(Object.keys(emitter.listenerTree).length, 0, 'should not have any keys in tree');

    test.expect(3);
    test.done();
  },

  '11. Reporting many listeners on wildcard all should removed by dual wildcard.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var type1 = 'ns.*.card',
        type2 = 'ns.wild.card',
        listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    emitter.on(type1, f);
    emitter.on(type2, f);

    // check number of listeners by wild card
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 2, 'should only have 2');

    // remove by wild card should remove both
    emitter.removeListener('ns.**', f);
    listeners = emitter.listeners(type1);
    test.equal(listeners.length, 0, 'should be 0');
    test.equal(Object.keys(emitter.listenerTree).length, 0, 'should not have any keys in tree');

    test.expect(3);
    test.done();
  },

  '12. Reporting many listeners on wildcard all should removed by dual wildcard, mixed with single.' : function (test) {

    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var types = [
      'ns.1.a.*.card',
      'ns.1.a.wild.card',
      'ns.2.a.*.card',
      'ns.2.a.wild.card',
    ];
    var listeners;

    var f = function () {
      test.ok(true, 'event was raised');
    };

    for (var i = 0; i < types.length; i++) {
      emitter.on(types[i], f);
    }

    // check number of listeners by wild card
    listeners = emitter.listeners(types[0]);
    test.equal(listeners.length, 2, 'should only have 2');

    listeners = emitter.listeners(types[2]);
    test.equal(listeners.length, 2, 'should only have 2');

    // this crazy pattern should remove everything
    emitter.removeListener('ns.*.a.*.**', f);
    listeners = emitter.listeners(types[0]);
    test.equal(listeners.length, 0, 'should be 0');
    listeners = emitter.listeners(types[1]);
    test.equal(listeners.length, 0, 'should be 0');
    test.equal(Object.keys(emitter.listenerTree).length, 0, 'should not have any keys in tree');

    test.expect(5);
    test.done();
  },

  '12. Add some listeners with wildcards and remove only the wildcard' : function (test) {
    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var count = 0;
    var badCount = 0;
    var goodCallback = function () {
      count++;
    };
    var badCallback = function () {
      count++;
      badCount++;
    };

    emitter.on('foo.bar.baz', goodCallback);
    emitter.on('foo.bar.baz', goodCallback);

    // Add and remove one with wildcard
    emitter.on('foo.*.*', badCallback);
    var returnValue = emitter.off('foo.*.*', badCallback);

    emitter.emit('foo.bar.baz');

    test.equal(count, 2, 'should call only good callbacks');
    test.equal(badCount, 0, 'should call not call bad callbacks');
    test.equal(returnValue, emitter, 'should allow chaining');

    test.expect(3);
    test.done();
  },

  '13. Very long wildcards' : function (test) {
    var emitter = new EventEmitter2({
      wildcard : true,
      verbose : true
    });

    var count = 0;
    function cb() {
      count++;
    }
    var short = 'foo.bar.baz';
    var long = 'foo.bar.baz.biff.bozz';

    emitter.on('foo.*.*.*.*', cb);
    emitter.on('foo.**', cb);

    test.equal(emitter.listeners(short).length, 1, 'only one matching listener for short');
    test.equal(emitter.listeners(long).length, 2, 'two matching listeners for long');

    emitter.emit(short);
    test.equal(count, 1, 'only first should match');

    emitter.emit(long);
    test.equal(count, 3, 'both');

    emitter.removeListener('foo.*.*.*.*', cb);
    test.equal(emitter.listeners(short).length, 1, 'only one matching listener');
    test.equal(emitter.listeners(long).length, 1, 'long listener removed');

    emitter.removeListener('foo.**', cb);
    test.equal(emitter.listeners(short).length, 0, 'short listener removed');

    test.equal(Object.keys(emitter.listenerTree).length, 0, 'should not have any keys in tree');

    test.expect(8);
    test.done();
  }
});
