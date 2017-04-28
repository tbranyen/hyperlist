'use strict'

// Default configuration.
const defaultConfig = {
  width: '100%',
  height: '100%'
}

// Check for valid number.
const isNumber = input => Number(input) === Number(input)

/**
 * Creates a HyperList instance that virtually scrolls very large amounts of
 * data effortlessly.
 */
export default class HyperList {
  static create (element, userProvidedConfig) {
    return new HyperList(element, userProvidedConfig)
  }

  static getMaxBrowserHeight () {
    // Create two elements, the wrapper is `1px` tall and is transparent and
    // positioned at the top of the page. Inside that is an element that gets
    // set to 1 billion pixels. Then reads the max height the browser can
    // calculate.
    const wrapper = document.createElement('div')
    const fixture = document.createElement('div')

    // As said above, these values get set to put the fixture elements into the
    // right visual state.
    wrapper.style = 'position: absolute; height: 1px; opacity: 0;'
    fixture.style = 'height: 1000000000px;'

    // Add the fixture into the wrapper element.
    wrapper.appendChild(fixture)

    // Apply to the page, the values won't kick in unless this is attached.
    document.body.appendChild(wrapper)

    // Get the maximum element height in pixels.
    const maxElementHeight = fixture.offsetHeight

    // Remove the element immediately after reading the value.
    document.body.removeChild(wrapper)

    return maxElementHeight
  }

  constructor (element, userProvidedConfig) {
    this._config = {}
    this._lastRepaint = null
    this._maxElementHeight = HyperList.getMaxBrowserHeight()

    this.refresh(element, userProvidedConfig)

    const config = this._config

    if (config.reverse) {
      window.requestAnimationFrame(() => {
        element.scrollTop = config.total * config.itemHeight
      })
    }

    // Create internal render loop.
    const render = () => {
      const scrollTop = this._getScrollPosition()
      const screenItemsLen = this._screenItemsLen
      const maxBuffer = screenItemsLen * config.itemHeight
      const lastRepaint = this._lastRepaint

      this._renderAnimationFrame = window.requestAnimationFrame(render)

      if (scrollTop === lastRepaint) {

      } else if (!lastRepaint || Math.abs(scrollTop - lastRepaint) > maxBuffer) {
        this._renderChunk()
        this._lastRepaint = scrollTop

        if (typeof config.afterRender === 'function') {
          config.afterRender()
        }
      }
    }

    render()
  }

  destroy () {
    window.cancelAnimationFrame(this._renderAnimationFrame)
  }

  refresh (element, userProvidedConfig) {
    Object.assign(this._config, defaultConfig, userProvidedConfig)

    if (!element || element.nodeType !== 1) {
      throw new Error('HyperList requires a valid DOM Node container')
    }

    this._element = element

    const config = this._config

    const scroller = this._scroller || config.scroller ||
      document.createElement(config.scrollerTagName || 'tr')

    // Default configuration option `useFragment` to `true`.
    if (typeof config.useFragment !== 'boolean') {
      this._config.useFragment = true
    }

    if (!config.generate) {
      throw new Error('Missing required `generate` function')
    }

    if (!isNumber(config.total)) {
      throw new Error('Invalid required `total` value, expected number')
    }

    if (!Array.isArray(config.itemHeight) && !isNumber(config.itemHeight)) {
      throw new Error(`
        Invalid required \`itemHeight\` value, expected number or array
      `.trim())
    } else if (isNumber(config.itemHeight)) {
      this._itemHeights = Array(config.total).fill(config.itemHeight)
    } else {
      this._itemHeights = config.itemHeight
    }

    // Reuse the item positions if refreshed, otherwise set to empty array.
    this._itemPositions = this._itemPositions || []

    // Each index in the array should represent the position in the DOM.
    this._calculatePositions(0)

    // Width and height should be coerced to string representations. Either in
    // `%` or `px`.
    Object.keys(defaultConfig).filter(prop => prop in config).forEach(prop => {
      const value = config[prop]

      if (!value) {
        return;
      } else if (typeof value !== 'string' && typeof value !== 'number') {
        let msg = `Invalid optional \`${prop}\`, expected string or number`
        throw new Error(msg)
      } else if (isNumber(value) || value.slice(-1) !== '%') {
        config[prop] = `${value}px`
      }
    })

    // Decorate the container element with inline styles that will match
    // the user supplied configuration.
    element.setAttribute('style', `
      width: ${config.width};
      height: ${config.height};
      overflow: auto;
      position: relative;
      padding: 0px;
    `)

    const scrollerHeight = config.itemHeight * config.total
    const maxElementHeight = this._maxElementHeight

    if (scrollerHeight > maxElementHeight) {
      console.warn([
        'HyperList: The maximum element height', maxElementHeight + 'px has',
        'been exceeded; please reduce your item height.'
      ].join(' '))
    }

    scroller.setAttribute('style', `
      opacity: 0;
      position: absolute;
      width: 1px;
      height: ${scrollerHeight}px;
    `)

    // Only append the scroller element once.
    if (!this._scroller) {
      element.appendChild(scroller)
    }

    const height = userProvidedConfig.height
    const elementHeight = element.offsetHeight
    const resolvedHeight = typeof height === 'string' ? elementHeight : height

    this._screenItemsLen = Math.ceil(resolvedHeight / config.itemHeight)
    // Cache 4 times the number of items that fit in the container viewport.
    this._cachedItemsLen = this._screenItemsLen * 3

    // Set the scroller instance.
    this._scroller = scroller

    // Render after refreshing.
    this._renderChunk()

    if (typeof config.afterRender === 'function') {
      config.afterRender()
    }
  }

  _calculatePositions (startFrom) {
    const itemHeights = this._itemHeights
    const itemPos = this._itemPositions

    itemHeights.slice(startFrom).forEach((itemHeight, i) => {
      console.log(`Item Height: ${itemHeight}`);
      let prevHeight = isNumber(itemPos[i - 1]) ? itemPos[i - 1] : -itemHeight
      itemPos[i] = prevHeight + itemHeight
    })
  }

  _getRow (i) {
    const config = this._config
    const item = config.generate.apply(null, arguments)

    if (!item || item.nodeType !== 1) {
      throw new Error(`Generator did not return a DOM Node for index: ${i}`)
    }

    const oldClass = item.getAttribute('class') || ''
    item.setAttribute('class', `${oldClass} ${config.rowClassName || 'vrow'}`)

    return item
  }

  _getScrollPosition () {
    const config = this._config

    if (typeof config.overrideScrollPosition === 'function') {
      return config.overrideScrollPosition()
    }

    return this._element.scrollTop
  }

  _renderChunk () {
    const config = this._config
    const element = this._element
    const scrollTop = this._getScrollPosition()
    const screenItemsLen = this._screenItemsLen
    const getRow = this._getRow.bind(this)
    const total = config.total
    const itemHeight = config.itemHeight
    const estFrom = Math.floor(scrollTop / itemHeight) - screenItemsLen
    const from = estFrom > total ? total : estFrom < 0 ? 0 : estFrom
    const estTo = from + this._cachedItemsLen
    const to = estTo > total ? total : estTo < 0 ? 0 : estTo
    const fastCache = []
    const state = { semaphore: null, isRendering: false }
    const arity = config.generate.length

    // Append all the new rows in a document fragment that we will later append
    // to the parent node
    const fragment = config.useFragment ? document.createDocumentFragment() : [
      // Sometimes you'll pass fake elements to this tool and Fragments require
      // real elements.
    ]

    // The element that forces the container to scroll.
    const scroller = this._scroller

    // Keep the scroller in the list of children.
    fragment[config.useFragment ? 'appendChild' : 'push'](scroller)

    state.isRendering = true

    for (let i = from; i < to; i++) {
      let updateIndex = newHeight => {
        state.semaphore--

        if (!isNumber(newHeight)) { return }
        this._itemHeights[i] = newHeight

        // Render the new positions.
        if (!state.isRendering && !state.semaphore) {
          this._applyPositions(from, to, fastCache)
        }
      }

      if (arity > 1) {
        state.semaphore = !state.semaphore ? 0 : ++state.semaphore
      }

      let row = getRow.apply(this, [
        config.reverse ? config.total - 1 - i : i,
        arity > 1 ? updateIndex : undefined
      ])

      fastCache[i] = row
      fragment[config.useFragment ? 'appendChild' : 'push'](row)
    }

    state.isRendering = false

    // Set the positions for the first (and hopefully last) time.
    this._applyPositions(from, to, fastCache)

    if (config.applyPatch) {
      return config.applyPatch(element, fragment)
    }

    element.innerHTML = ''
    element.appendChild(fragment)
  }

  _applyPositions (from, to, fastCache) {
    this._calculatePositions(from)

    const config = this._config
    const reverse = config.reverse
    const itemPositions = this._itemPositions

    for (let i = from; i < to; i++) {
      let item = fastCache[i]
      let offsetTop = itemPositions[i]
      let top = reverse ? itemPositions.slice(-1) - offsetTop : offsetTop

      item.setAttribute('style', `
        ${item.style.cssText || ''}
        position: absolute;
        top: ${top}px
      `)
    }
  }
}
