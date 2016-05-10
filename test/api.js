require('./_setup');

import './_setup';
import assert from 'assert';
import HyperList from '../lib/index';

describe('API', () => {
  var fixture = null;

  beforeEach(() => {
    fixture = document.createElement('div');
  });

  it('can be imported with ES6', () => {
    assert.equal(typeof HyperList, 'function');
  });

  it('can be initialized with new', () => {
    var actual = new HyperList(fixture, {
      generate() {},
      total: 0
    });

    assert.ok(actual instanceof HyperList);
  });

  it('is not easy to access private members', () => {
    var actual = new HyperList(fixture, {
      generate() {},
      total: 0
    });

    assert.equal(actual.config, undefined);
    assert.equal(actual[Symbol('config')], undefined);
  });

  it('is not easy to access private members', () => {
    var actual = new HyperList(fixture, {
      generate() {},
      total: 0
    });

    assert.equal(actual.config, undefined);
    assert.equal(actual[Symbol('config')], undefined);
  });
});
