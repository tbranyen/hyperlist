require('./_setup');

const assert = require('assert');
const HyperList = require('../');

describe('API', () => {
  var fixture = null;

  beforeEach(() => {
    fixture = document.createElement('div');
  });

  it('requires being called with default in ES5', () => {
    assert.notEqual(typeof HyperList, 'function');
    assert.equal(typeof HyperList.default, 'function');
  });

  it('can be initialized with new', () => {
    var actual = new HyperList.default(fixture, {
      generate() {},
      total: 0
    });

    assert.ok(actual instanceof HyperList.default);
  });

  it('is not easy to access private members', () => {
    var actual = new HyperList.default(fixture, {
      generate() {},
      total: 0
    });

    assert.equal(actual.config, undefined);
    assert.equal(actual[Symbol('config')], undefined);
  });

  it('is not easy to access private members', () => {
    var actual = new HyperList.default(fixture, {
      generate() {},
      total: 0
    });

    assert.equal(actual.config, undefined);
    assert.equal(actual[Symbol('config')], undefined);
  });
});
