import './_setup'
import assert from 'assert'
import HyperList from '../lib/index'

describe('Rendering', function () {
  beforeEach(() => {
    this.fixture = document.createElement('div')
  })

  afterEach(() => {
    if (this.actual) {
      this.actual.destroy()
    }
  })

  it('can render a small amount of items', (done) => {
    this.actual = new HyperList(this.fixture, {
      generate (i) {
        var el = document.createElement('div')
        el.innerHTML = i
        return el
      },
      height: 5,
      overrideScrollPosition () { return 0 },
      total: 3,
      itemHeight: 1
    })

    window.requestAnimationFrame(() => {
      assert.equal(this.fixture.childNodes.length, 4)
      assert.equal(this.fixture.querySelectorAll('div').length, 3)
      assert.equal(this.fixture.firstChild.nodeName, 'tr')
      done()
    })
  })
})
