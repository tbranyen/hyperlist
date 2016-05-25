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

    requestAnimationFrame(() => {
      assert.equal(this.fixture.scrollTop, 500000);
      done();
    });
  });

  it('can render in reverse', (done) => {
    var childNodes = null;

    this.actual = new HyperList(this.fixture, {
      generate(i) {
        const el = document.createElement('div');
        el.innerHTML = i;
        return el;
      },

      applyPatch(element, fragment) {
        childNodes = fragment.map(childNode => {
          return childNode.innerHTML;
        }).filter(Boolean);
      },

      overrideScrollPosition() {
        return 0;
      },

      height: 5,
      total: 3,
      itemHeight: 1,
      reverse: true,
      useFragment: false,
    });

    requestAnimationFrame(() => {
      assert.deepEqual(childNodes, [2, 1, 0]);
      done();
    });
  });
});
