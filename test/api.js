import assert from 'assert'
import HyperList from '../lib/index'
require('./_setup')

describe('API', function () {
  beforeEach(() => {
    this.fixture = document.createElement('div')
  })

  afterEach(() => {
    if (this.actual) {
      this.actual.destroy()
    }
  })

  it('can be imported with ES6', () => {
    assert.equal(typeof HyperList, 'function')
  })

  it('can be initialized with new', () => {
    this.actual = new HyperList(this.fixture, {
      generate () {},
      itemHeight: 100,
      total: 0
    })

    assert.ok(this.actual instanceof HyperList)
  })

  it('can be initialized with create', () => {
    this.actual = HyperList.create(this.fixture, {
      generate () {},
      itemHeight: 100,
      total: 0
    })

    assert.ok(this.actual instanceof HyperList)
  })

  it('is not easy to access private members', () => {
    this.actual = new HyperList(this.fixture, {
      generate () {},
      itemHeight: 100,
      total: 0
    })

    assert.equal(this.actual.config, undefined)
    assert.equal(this.actual[Symbol('config')], undefined)
  })

  it('can destroy an instance', () => {
    this.actual = new HyperList(this.fixture, {
      generate () {},
      itemHeight: 100,
      total: 0
    })

    assert.doesNotThrow(() => {
      this.actual.destroy()
    })
  })

  it('can override the patch method', (done) => {
    var childNodes = null

    this.actual = new HyperList(this.fixture, {
      generate (i) {
        var el = document.createElement('div')
        el.innerHTML = i
        return el
      },

      applyPatch (element, fragment) {
        childNodes = fragment.childNodes
      },

      overrideScrollPosition () {
        return 0
      },

      height: 5,
      total: 3,
      itemHeight: 1
    })

    window.requestAnimationFrame(() => {
      assert.equal(childNodes.length, 4)
      done()
    })
  })

  it('supports string based height', (done) => {
    this.fixture.offsetHeight = 500

    this.actual = new HyperList(this.fixture, {
      generate (i) {
        var el = document.createElement('div')
        el.innerHTML = i
        return el
      },

      overrideScrollPosition () {
        return 0
      },

      height: '100%',
      total: 3,
      itemHeight: 1
    })

    window.requestAnimationFrame(() => {
      assert.equal(this.fixture.style.height, '100%')
      done()
    })
  })
})
