Base (after initial refactor):

EventEmitter2 (remove after adding many) x 35,648 ops/sec ±2.06% (80 runs sampled)
EventEmitter2 (remove after adding many, deep) x 7,054 ops/sec ±0.77% (23 runs sampled)

After removing duplicated keys():

EventEmitter2 (remove after adding many) x 35,317 ops/sec ±1.92% (83 runs sampled)
EventEmitter2 (remove after adding many, deep) x 15,736 ops/sec ±1.35% (64 runs sampled)

For-in:
EventEmitter2 (remove after adding many) x 35,265 ops/sec ±2.30% (83 runs sampled)
EventEmitter2 (remove after adding many, deep) x 20,932 ops/sec ±1.14% (82 runs sampled)

Rev GC:
EventEmitter2 (remove after adding many) x 154,579 ops/sec ±23.17% (78 runs sampled)
EventEmitter2 (remove after adding many, deep) x 30,017 ops/sec ±2.65% (84 runs sampled)
EventEmitter2 (remove after adding many, deep wildcards) x 115,887 ops/sec ±1.80% (82 runs sampled)
EventEmitter2 (remove after adding many, double wildcard) x 15,968 ops/sec ±1.92% (84 runs sampled)
