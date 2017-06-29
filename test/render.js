import './_setup'
import assert from 'assert'
import HyperList from '../lib/index'

describe('Rendering', function () {
  this.timeout(10000)

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

  it('can render with dynamic heights', (done) => {
    const total = 3
    const heights = new Array(3).fill(0).map((e, i) => (i + 1) * 10)

    this.actual = new HyperList(this.fixture, {
      generate (i) {
        var el = document.createElement('div')
        el.innerHTML = i
        return {element: el, height: heights[i]}
      },
      height: 10,
      overrideScrollPosition () { return 0 },
      total: total,
      itemHeight: 1
    })

    window.requestAnimationFrame(() => {
      assert.deepEqual([].slice.call(this.fixture.querySelectorAll('div')).map((e) => {
        return e.style.top
      }), ['0px', '10px', '30px'])
      done()
    })
  })

  it('will show every elements with dynamic heights', (done) => {
    const total = 100
    const maxItemHeight = 100
    const minItemHeight = 50
    const heights = new Array(total).fill(0).map((e, i) => Math.random() * (maxItemHeight - minItemHeight) + minItemHeight)
    const height = 400

    this.fixture.scrollTop = 0
    this.actual = new HyperList(this.fixture, {
      generate (i) {
        var el = document.createElement('div')
        el.innerHTML = i
        return {element: el, height: heights[i]}
      },
      height: height,
      total: total,
      itemHeight: maxItemHeight
    })

    let scrollHeight
    let numberElementsShown = []

    const doScroll = () => {
      scrollHeight = parseFloat(this.fixture.querySelector('tr').style.height.replace('px', ''), 10)
      const numbers = [].slice.call(this.fixture.querySelectorAll('div'))
        .map((e) => parseInt(e.innerHTML))
        .filter((e) => !~numberElementsShown.indexOf(e))

      numberElementsShown.push.apply(numberElementsShown, numbers)

      this.fixture.scrollTop += minItemHeight
      this.actual._renderChunk()

      if (this.fixture.scrollTop > scrollHeight) {
        assert.equal(total, numberElementsShown.length)
        done()
        return
      }

      window.requestAnimationFrame(doScroll)
    }

    window.requestAnimationFrame(doScroll)
  })

  it('can refresh with new data', (done) => {
    const data = ['a', 'b', 'c', 'd']
    const config = {
      generate (i) {
        var el = document.createElement('div')
        if (data[i]) {
          el.innerHTML = data[i]
        } else {
          el.innerHTML = 'placeholder'
        }
        return el
      },
      height: 100,
      overrideScrollPosition () { return 0 },
      get total () {
        return data.length + 20
      },
      itemHeight: 10
    }

    this.actual = new HyperList(this.fixture, config)

    const getShown = () => {
      return [].slice.call(this.fixture.querySelectorAll('div'))
        .map((e) => e.innerHTML)
        .filter((e) => e !== 'placeholder')
    }

    window.requestAnimationFrame(() => {
      assert.deepEqual(data, getShown())

      data.push(...['e', 'f', 'g', 'h'])
      this.actual.refresh(this.fixture, config)

      window.requestAnimationFrame(() => {
        assert.deepEqual(data, getShown())
        done()
      })
    })
  })
})
