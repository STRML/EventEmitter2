// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
"use strict";
var path = require('path');
var assert = require('assert');

exports.testDir = path.dirname(__filename);
exports.fixturesDir = path.join(exports.testDir, 'fixtures');
exports.libDir = path.join(exports.testDir, '../lib');
exports.tmpDir = path.join(exports.testDir, 'tmp');
exports.PORT = 12346;

if (process.platform == 'win32') {
  exports.PIPE = '\\\\.\\pipe\\libuv-test';
} else {
  exports.PIPE = exports.tmpDir + '/test.sock';
}

var util = require('util');
for (var i in util) exports[i] = util[i];
//for (var i in exports) global[i] = exports[i];

function protoCtrChain(o) {
  var result = [];
  for (; o; o = o.__proto__) { result.push(o.constructor); }
  return result.join();
}

exports.indirectInstanceOf = function(obj, cls) {
  if (obj instanceof cls) { return true; }
  var clsChain = protoCtrChain(cls.prototype);
  var objChain = protoCtrChain(obj);
  return objChain.slice(-clsChain.length) === clsChain;
};


// Turn this off if the test should not check for global leaks.
exports.globalCheck = true;

process.on('exit', function() {
  if (!exports.globalCheck) return;
  var knownGlobals = [setTimeout,
                      setInterval,
                      clearTimeout,
                      clearInterval,
                      console,
                      Buffer,
                      process,
                      global.ArrayBuffer!==undefined?ArrayBuffer:null,
                      global.Int8Array!==undefined?Int8Array:null,
                      global.Uint8Array!==undefined?Uint8Array:null,
                      global.Int16Array!==undefined?Int16Array:null,
                      global.Uint16Array!==undefined?Uint16Array:null,
                      global.Int32Array!==undefined?Int32Array:null,
                      global.Uint32Array!==undefined?Uint32Array:null,
                      global.Float32Array!==undefined?Float32Array:null,
                      global.Float64Array!==undefined?Float64Array:null,
                      global.DataView!==undefined?DataView:null,
                      global.Uint8ClampedArray!==undefined?Uint8ClampedArray:null,
                      global
                      ];

  if (global.setImmediate) {
    knownGlobals.push(setImmediate, clearImmediate);
  }
  if (global.errno) {
    knownGlobals.push(errno);
  }

  if (global.gc) {
    knownGlobals.push(gc);
  }

  if (global.DTRACE_HTTP_SERVER_RESPONSE) {
    knownGlobals.push(DTRACE_HTTP_SERVER_RESPONSE);
    knownGlobals.push(DTRACE_HTTP_SERVER_REQUEST);
    knownGlobals.push(DTRACE_HTTP_CLIENT_RESPONSE);
    knownGlobals.push(DTRACE_HTTP_CLIENT_REQUEST);
    knownGlobals.push(DTRACE_NET_STREAM_END);
    knownGlobals.push(DTRACE_NET_SERVER_CONNECTION);
  }

	if(global.COUNTER_NET_SERVER_CONNECTION){
    knownGlobals.push(COUNTER_NET_SERVER_CONNECTION);
    knownGlobals.push(COUNTER_NET_SERVER_CONNECTION_CLOSE);
    knownGlobals.push(COUNTER_HTTP_SERVER_REQUEST);
    knownGlobals.push(COUNTER_HTTP_SERVER_RESPONSE);
		knownGlobals.push(COUNTER_HTTP_CLIENT_REQUEST);
    knownGlobals.push(COUNTER_HTTP_CLIENT_RESPONSE);
  }


  for (var x in global) {
    var found = false;

    for (var y in knownGlobals) {
      if (global[x] === knownGlobals[y]) {
        found = true;
        break;
      }
    }

    if (!found) {
      console.error('Unknown global: %s', x);
      assert.ok(false, 'Unknown global founded');
    }
  }
});


// This function allows one two run an HTTP test agaist both HTTPS and
// normal HTTP modules. This ensures they fit the same API.
exports.httpTest = function httpTest(cb) {
};
