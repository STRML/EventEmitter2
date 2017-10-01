var simpleEvents = require('nodeunit').testCase;

var EventEmitter2;

if(typeof require !== 'undefined') {
  EventEmitter2 = require('../../lib/eventemitter2').EventEmitter2;
} else {
  EventEmitter2 = window.EventEmitter2;
}

module.exports = simpleEvents({

  '1. delimiter at the start': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true
    });

    emitter.on('.ns1.ns2', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('.ns1.ns2');

    test.expect(1);
    test.done();
  },
  '2. delimiter at the middle': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true
    });

    emitter.on('ns1..ns3', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('ns1..ns3');

    test.expect(1);
    test.done();
  },
  '3. delimiter at the end': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true
    });

    emitter.on('ns1.ns2.', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('ns1.ns2.');

    test.expect(1);
    test.done();
  },
  '4. custom delimiter at the start': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '/'
    });

    emitter.on('/ns1/ns2', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('/ns1/ns2');

    test.expect(1);
    test.done();
  },
  '5. custome delimiter at the middle': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '/'
    });

    emitter.on('ns1//ns3', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('ns1//ns3');

    test.expect(1);
    test.done();
  },
  '6. custome delimiter at the end': function (test) {
    var emitter = new EventEmitter2({
      wildcard: true
    });

    emitter.on('ns1/ns2/', function () {
      test.ok(true, 'event was raised');
    });

    emitter.emit('ns1/ns2/');

    test.expect(1);
    test.done();
  }

});
