const assert = require('node:assert/strict');
const { calculate, services } = require('./dist/app.js');

assert.deepEqual(calculate(services[0], 16, 2), { price: 20, total: 40, quantity: 2 });
assert.deepEqual(calculate(services[0], 16, 2, false), { price: 10, total: 20, quantity: 2 });
assert.equal(calculate(services[0], 15, 3, false).total, 28.5);
assert.equal(calculate(services[0], 18, 4).total, 104);
assert.deepEqual(calculate(services[1], 16, 4), { price: 20, total: 20, quantity: 1 });
assert.deepEqual(calculate(services[2], 16, 2), { price: 9, total: 18, quantity: 2 });
assert.equal(calculate(services[2], 22, 3).total, 45);
console.log('Wheel replacement, puncture and balancing estimates passed.');
