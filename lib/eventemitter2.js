/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Modified 2017 STRML
 * Licensed under the MIT license.
 */

/* global define:false */
;!function(undefined) {

  const defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {
      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      this._maxListeners = conf.maxListeners !== undefined ? conf.maxListeners : defaultMaxListeners;

      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    } else {
      this._maxListeners = defaultMaxListeners;
    }
  }

  function logPossibleMemoryLeak(count, eventName) {
    let errorMsg = '(node) warning: possible EventEmitter memory ' +
        'leak detected. ' + count + ' listeners added. ' +
        'Use emitter.setMaxListeners() to increase limit.';

    if(this.verboseMemoryLeak){
      errorMsg += ' Event name: ' + eventName + '.';
    }

    if(typeof process !== 'undefined' && process.emitWarning){
      const e = new Error(errorMsg);
      e.name = 'MaxListenersExceededWarning';
      e.emitter = this;
      e.count = count;
      process.emitWarning(e);
    } else {
      console.error(errorMsg);

      if (console.trace){
        console.trace();
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    this.verboseMemoryLeak = false;
    configure.call(this, conf);
  }
  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches.
  //
  // The return type is leafs (objects containing _listeners and potentially sub-leafs),
  // the `handlers` array, if present, is filled with functions to call.
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    let listeners=[], typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners && tree._listeners.length) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      handlers && Array.prototype.push.apply(handlers, tree._listeners);
      return [tree];
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (const branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        const endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners && tree._listeners.length) {
          // The next element has a _listeners, add it to the listeners.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (const branch in tree) {
          if (branch !== '_listeners' && branch !== '_parent' && tree.hasOwnProperty(branch)) {
            if (branch === '*' || branch === '**') {
              if (tree[branch]._listeners && tree[branch]._listeners.length && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if (branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    const xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    const xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners && xxTree._listeners.length) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(const branch in xxTree) {
          if(branch !== '_listeners' && branch !== '_parent' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              const isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners && xxTree._listeners.length) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners.length) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(let i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    let tree = this.listenerTree;
    let name = type.shift();

    while (name !== undefined) {

      if (!tree[name]) {
        tree[name] = {
          _listeners: [],
          _parent: tree,
        };
      }

      tree = tree[name];

      if (type.length === 0) {
        tree._listeners.push(listener);

        if (
          !tree._listeners.warned &&
          this._maxListeners > 0 &&
          tree._listeners.length > this._maxListeners
        ) {
          tree._listeners.warned = true;
          logPossibleMemoryLeak.call(this, tree._listeners.length, name);
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    if (n !== undefined) {
      this._maxListeners = n;
      if (!this._conf) this._conf = {};
      this._conf.maxListeners = n;
    }
  };

  EventEmitter.prototype.event = '';


  EventEmitter.prototype.once = function(event, fn) {
    return this._once(event, fn, false);
  };

  EventEmitter.prototype.prependOnceListener = function(event, fn) {
    return this._once(event, fn, true);
  };

  EventEmitter.prototype._once = function(event, fn, prepend) {
    this._many(event, 1, fn, prepend);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    return this._many(event, ttl, fn, false);
  };

  EventEmitter.prototype.prependMany = function(event, ttl, fn) {
    return this._many(event, ttl, fn, true);
  };

  EventEmitter.prototype._many = function(event, ttl, fn, prepend) {
    const self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      return fn.apply(this, arguments);
    }

    listener._origin = fn;

    this._on(event, listener, prepend);

    return self;
  };

  EventEmitter.prototype.emit = function(...allArgs) {

    this._events || init.call(this);
    const [type, ...restArgs] = allArgs;

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) {
        return false;
      }
    }

    let handler;

    if (this._all && this._all.length) {
      handler = this._all.slice();
      for (let i = 0; i < handler.length; i++) {
        this.event = type; // Needs to be set before each handler b/c it can change
        handler[i].apply(this, allArgs);
      }
    }

    if (this.wildcard) {
      handler = [];
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
      if (typeof handler === 'function') {
        this.event = type;
        handler.apply(this, restArgs);
        return true;
      } else if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice();
      }
    }

    if (handler && handler.length) {
      for (let i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        handler[i].apply(this, restArgs);
      }
      return true;
    } else if (!this._all && type === 'error') {
      if (restArgs[0] instanceof Error) {
        throw restArgs[0]; // Unhandled 'error' event
      } else {
        throw new Error('Uncaught, unspecified \'error\' event.');
      }
    }

    return Boolean(this._all);
  };

  EventEmitter.prototype.emitAsync = function(...allArgs) {

    this._events || init.call(this);

    const [type, ...restArgs] = allArgs;

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return Promise.resolve([false]); }
    }

    const promises = [];

    let handler;

    if (this._all) {
      handler = this._all.slice();
      for (let i = 0; i < handler.length; i++) {
        this.event = type;
        promises.push(handler[i].apply(this, allArgs));
      }
    }

    if (this.wildcard) {
      handler = [];
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      promises.push(handler.apply(this, restArgs));
    } else if (handler && handler.length) {
      handler = handler.slice();
      for (let i = 0; i < handler.length; i++) {
        this.event = type;
        promises.push(handler[i].apply(this, restArgs));
      }
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]); // Unhandled 'error' event
      } else {
        return Promise.reject('Uncaught, unspecified \'error\' event.');
      }
    }

    return Promise.all(promises);
  };

  EventEmitter.prototype.on = function(type, listener) {
    return this._on(type, listener, false);
  };

  EventEmitter.prototype.prependListener = function(type, listener) {
    return this._on(type, listener, true);
  };

  EventEmitter.prototype.onAny = function(fn) {
    return this._onAny(fn, false);
  };

  EventEmitter.prototype.prependAny = function(fn) {
    return this._onAny(fn, true);
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype._onAny = function(fn, prepend){
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if (!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    if(prepend){
      this._all.unshift(fn);
    }else{
      this._all.push(fn);
    }

    return this;
  };

  EventEmitter.prototype._on = function(type, listener, prepend) {
    if (typeof type === 'function') {
      this._onAny(type, listener);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if (this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      this._events[type] = [listener];
    }
    else {
      // If we've already got an array, just add
      if(prepend){
        this._events[type].unshift(listener);
      }else{
        this._events[type].push(listener);
      }

      // Check for listener leak
      if (
        !this._events[type].warned &&
        this._maxListeners > 0 &&
        this._events[type].length > this._maxListeners
      ) {
        this._events[type].warned = true;
        logPossibleMemoryLeak.call(this, this._events[type].length, type);
      }
    }

    return this;
  };

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    let handlers, leafs = [], ns = [];

    if(this.wildcard) {
      ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners: Array.isArray ? handlers : [handlers]});
    }

    for (let i = 0; i < leafs.length; i++) {
      const leaf = leafs[i];
      handlers = leaf._listeners;

      // Find the listener.
      let position = -1;
      for (let i = 0; i < handlers.length; i++) {
        if (handlers[i] === listener ||
          (handlers[i].listener && handlers[i].listener === listener) ||
          (handlers[i]._origin && handlers[i]._origin === listener)) {
          position = i;
          break;
        }
      }
      if (position < 0) continue; // not found

      if (this.wildcard) {
        handlers.splice(position, 1);
      }
      else {
        this._events[type].splice(position, 1);
      }

      if (handlers.length === 0) {
        if (this.wildcard) {
          this._reverseGarbageCollect(leaf, ns);
        }
        else {
          delete this._events[type];
        }
      }

      this.emit('removeListener', type, listener);
    }

    return this;
  };

  // Fast garbage collect that works by working down the tree to leaf nodes, then back up, deleting
  // as it goes. Doesn't require iterating over entire sets, so it is constant time for exact subscriptions.
  // When deleting wildcards (e.g. foo.bar.*), it is O(n) where n is the number of leaf nodes.
  EventEmitter.prototype._reverseGarbageCollect = function(leaf, ns) {
    if (!leaf || !leaf._parent) return;

    let depth = 0;
    let parent = leaf;
    while((parent = parent._parent)) {
      depth++;
    }

    // Work backwards down the tree
    let thisNode = leaf;
    for (let i = depth; i > 0; i--) {
      const key = ns[i - 1];
      const parent = thisNode._parent;
      if (!parent) break;
      if (Object.keys(thisNode).length === 2 || key === '**') {
        delete parent[key];
        if (key === '*' || key === '**') {
          for (const subKey in parent) {
            if (subKey !== '_listeners' && subKey !== '_parent' && parent[subKey]._listeners.length === 0 &&
              (key === '**' || Object.keys(parent[subKey]).length === 2)) {
              delete parent[subKey]._parent;
              delete parent[subKey];
            }
          }
        }
        delete thisNode._parent; // delete backref
      }
      thisNode = parent;
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    let i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          this.emit('removeListenerAny', fn);
          return this;
        }
      }
    } else {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++)
        this.emit('removeListenerAny', fns[i]);
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if (this.wildcard) {
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      const leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (let iLeaf=0; iLeaf < leafs.length; iLeaf++) {
        const leaf = leafs[iLeaf];
        leaf._listeners.length = 0;
      }
    }
    else if (this._events) {
      delete this._events[type];
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (this.wildcard) {
      const handlers = [];
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!Array.isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.eventNames = function(){
    return Object.keys(this._events);
  };

  EventEmitter.prototype.listenerCount = function(type) {
    return this.listeners(type).length;
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = EventEmitter;
  } else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();
