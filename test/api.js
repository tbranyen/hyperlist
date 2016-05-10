require('./_setup');

import './_setup';
import assert from 'assert';
import HyperList from '../lib/index';

describe('API', function() {
  beforeEach(() => {
    this.fixture = document.createElement('div');
  });

  afterEach(() => {
    if (this.actual) {
      this.actual.destroy();
    }
  });

  it('can be imported with ES6', () => {
    assert.equal(typeof HyperList, 'function');
  });

  it('can be initialized with new', () => {
    this.actual = new HyperList(this.fixture, {
      generate() {},
      total: 0
    });

    assert.ok(this.actual instanceof HyperList);
  });

  it('can be initialized with create', () => {
    this.actual = HyperList.create(this.fixture, {
      generate() {},
      total: 0
    });

    assert.ok(this.actual instanceof HyperList);
  });

  it('is not easy to access private members', () => {
    this.actual = new HyperList(this.fixture, {
      generate() {},
      total: 0
    });

    assert.equal(this.actual.config, undefined);
    assert.equal(this.actual[Symbol('config')], undefined);
  });

  it('can destroy an instance', () => {
    this.actual = new HyperList(this.fixture, {
      generate() {},
      total: 0
    });

    assert.doesNotThrow(() => {
      this.actual.destroy();
    });
  });
});
