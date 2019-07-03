import './_setup'
import assert from 'assert'
import React from 'react'
import ReactFauxDOM from 'react-faux-dom'
import ReactDOMServer from 'react-dom/server'
import HyperList from '../lib/index'

describe('React', function () {
  beforeEach(() => {
    this.fixture = document.createElement('div')
  })

  afterEach(() => {
    if (this.actual) {
      this.actual.destroy()
    }
  })

  it('can render a small amount of items to react', (done) => {
    const reactContainer = ReactFauxDOM.createElement('div')

    this.actual = new HyperList(reactContainer, {
      generate (i) {
        const el = ReactFauxDOM.createElement('span')
        el.innerHTML = i
        return el
      },

      applyPatch (element, fragment) {
        fragment.forEach(childNode => element.appendChild(childNode))
      },

      overrideScrollPosition () {
        return 0
      },

      height: 5,
      useFragment: false,
      scroller: ReactFauxDOM.createElement('div'),
      itemHeight: 1,
      total: 3
    })

    class ViewportScroller extends React.Component {
      render () {
        return reactContainer.toReact()
      }
    }

    window.requestAnimationFrame(() => {
      const renderedString = ReactDOMServer.renderToString(
        React.createElement(ViewportScroller)
      )

      const actual = renderedString

      const expected = '<div style="width:100%;height:5px;overflow:auto;position:relative;" data-reactroot="" data-reactid="1" data-react-checksum="332446863"><div style="opacity:0;position:absolute;width:1px;height:3px;top:0px;" data-reactid="2"></div><div style="opacity:0;position:absolute;width:1px;height:3px;top:0px;" data-reactid="3"></div><span style="position:absolute;top:0px;" class=" vrow" data-reactid="4"></span><span style="position:absolute;top:1px;" class=" vrow" data-reactid="5">1</span><span style="position:absolute;top:2px;" class=" vrow" data-reactid="6">2</span></div>'

      assert.equal(actual, expected)
      done()
    })
  })
})
