require('./_setup');

import './_setup';
import assert from 'assert';
import HyperList from '../lib/index';

describe('Reverse feature', function() {
  beforeEach(() => {
    this.fixture = document.createElement('div');
  });

  afterEach(() => {
    if (this.actual) {
      this.actual.destroy();
    }
  });

  it('sets the scrollTop after render', (done) => {
    this.actual = new HyperList(this.fixture, {
      generate(i) { return '<div>' + i + '</div>'; },
      total: 10000,
      itemHeight: 50,
      reverse: true
    });

    setTimeout(() => {
      assert.equal(this.fixture.scrollTop, 500000);
      done();
    }, 10);
  });
});
