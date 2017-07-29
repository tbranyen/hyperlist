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

  /**
   * Update given attributes on an element
   * @param {DOMElement} element
   * @param {Object} values
   */
  static transformElement (element, values) {
    for (let i in values) {
      element.setAttribute(i, values[i])
    }

    return element
  }

  /**
   * Merge given css style on an element
   * @param {DOMElement} element
   * @param {Object} style
   * @param {Boolean} forceClone
   */
  static mergeStyle (element, style, forceClone) {
    for (let i in style) {
      if (element.style[i] !== style[i]) {
        element.style[i] = style[i]
      }
    }

    return element
  }

  /**
   * Return given attribute key of an element
   * @param {DOMElement} element
   * @param {String} key
   */
  static inspectElement (element, key) {
    return element.getAttribute(key)
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
    HyperList.mergeStyle(wrapper, {position: 'absolute', height: '1px', opacity: 0})
    HyperList.mergeStyle(fixture, {height: '1e7px'})

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

    if (!userProvidedConfig.inspectElement || typeof userProvidedConfig.inspectElement !== 'function') {
      userProvidedConfig.inspectElement = HyperList.inspectElement
    }

    if (!userProvidedConfig.transformElement || typeof userProvidedConfig.transformElement !== 'function') {
      userProvidedConfig.transformElement = HyperList.transformElement
    }

    if (!userProvidedConfig.mergeStyle || typeof userProvidedConfig.mergeStyle !== 'function') {
      userProvidedConfig.mergeStyle = HyperList.mergeStyle
    }

    this.refresh(element, userProvidedConfig)

    const config = this._config

    // Create internal render loop.
    const render = () => {
      const scrollTop = this._getScrollPosition()
      const lastRepaint = this._lastRepaint

      this._renderAnimationFrame = window.requestAnimationFrame(render)

      if (scrollTop === lastRepaint) {
        return
      }

      const diff = lastRepaint ? scrollTop - lastRepaint : 0
      if (!lastRepaint || diff < 0 || diff > this._averageHeight) {
        let rendered = this._renderChunk()

        this._lastRepaint = scrollTop

        if (rendered !== false && typeof config.afterRender === 'function') {
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

    if (!element || (typeof element.render !== 'function' && element.nodeType !== 1)) {
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

    // Width and height should be coerced to string representations. Either in
    // `%` or `px`.
    Object.keys(defaultConfig).filter(prop => prop in config).forEach(prop => {
      const value = config[prop]
      const isValueNumber = isNumber(value)

      if (value && typeof value !== 'string' && typeof value !== 'number') {
        let msg = `Invalid optional \`${prop}\`, expected string or number`
        throw new Error(msg)
      } else if (isValueNumber) {
        config[prop] = `${value}px`
      }
    })

    const isHoriz = Boolean(config.horizontal)
    const value = config[isHoriz ? 'width' : 'height']

    if (value) {
      const isValueNumber = isNumber(value)
      const isValuePercent = isValueNumber ? false : value.slice(-1) === '%'
      // Compute the containerHeight as number
      const numberValue = isValueNumber ? value : parseInt(value.replace(/px|%/, ''), 10)
      const innerSize = window[isHoriz ? 'innerWidth' : 'innerHeight']

      if (isValuePercent) {
        this._containerSize = (innerSize * numberValue) / 100
      } else {
        this._containerSize = isNumber(value) ? value : numberValue
      }
    }

    // Decorate the container element with styles that will match
    // the user supplied configuration.
    const elementStyle = {
      width: `${config.width}`,
      height: `${config.height}`,
      overflow: 'auto',
      position: 'relative'
    }

    config.mergeStyle(element, elementStyle)

    const scrollerHeight = config.itemHeight * config.total
    const maxElementHeight = this._maxElementHeight

    if (scrollerHeight > maxElementHeight) {
      console.warn([
        'HyperList: The maximum element height', maxElementHeight + 'px has',
        'been exceeded; please reduce your item height.'
      ].join(' '))
    }

    const scrollerStyle = {
      opacity: '0',
      position: 'absolute',
      [isHoriz ? 'height' : 'width']: '1px',
      [isHoriz ? 'width' : 'height']: `${scrollerHeight}px`
    }

    config.mergeStyle(scroller, scrollerStyle)

    // Only append the scroller element once if DOM node.
    if (!this._scroller && element.nodeType === 1) {
      element.appendChild(scroller)
    }

    // Set the scroller instance.
    this._scroller = scroller
    this._scrollHeight = this._computeScrollHeight()

    // Reuse the item positions if refreshed, otherwise set to empty array.
    this._itemPositions = this._itemPositions || Array(config.total).fill(0)

    // Each index in the array should represent the position in the DOM.
    this._computePositions(0)

    // Render after refreshing. Force render if we're calling refresh manually.
    this._renderChunk(this._lastRepaint !== null)

    if (typeof config.afterRender === 'function') {
      config.afterRender()
    }
  }

  _getRow (i) {
    const config = this._config
    let item = config.generate(i)
    let height = item.height

    if (height !== undefined && isNumber(height)) {
      item = item.element

      // The height isn't the same as predicted, compute positions again
      if (height !== this._itemHeights) {
        this._itemHeights[i] = height
        this._computePositions(i)
        this._scrollHeight = this._computeScrollHeight(i)
      }
    } else {
      height = this._itemHeights[i]
    }

    if (!item || (config.transformElement === HyperList.transformElement && item.nodeType !== 1)) {
      throw new Error(`Generator did not return a DOM Node for index: ${i}`)
    }

    const oldClass = config.inspectElement(item, 'class') || ''
    item = config.transformElement(item, {
      key: i,
      class: `${oldClass} ${config.rowClassName || 'vrow'}`
    })

    const top = this._itemPositions[i]

    // Possibly need to clone element
    item = config.mergeStyle(item, {
      position: 'absolute',
      [config.horizontal ? 'left' : 'top']: `${top}px`
    }, true)

    return item
  }

  _getScrollPosition () {
    const config = this._config

    if (typeof config.overrideScrollPosition === 'function') {
      return config.overrideScrollPosition()
    }

    return this._element[config.horizontal ? 'scrollLeft' : 'scrollTop']
  }

  _renderChunk (force) {
    const config = this._config
    const element = this._element
    const scrollTop = this._getScrollPosition()
    const total = config.total

    let from = config.reverse ? this._getReverseFrom(scrollTop) : this._getFrom(scrollTop) - 1

    if (from < 0 || from - this._screenItemsLen < 0) {
      from = 0
    }

    if (!force && this._lastFrom === from) {
      return false
    }

    this._lastFrom = from

    let to = from + this._cachedItemsLen

    if (to > total || to + this._cachedItemsLen > total) {
      to = total
    }

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

    for (let i = from; i < to; i++) {
      let row = this._getRow(i)

      fragment[config.useFragment ? 'appendChild' : 'push'](row)
    }

    if (config.applyPatch) {
      return config.applyPatch(element, fragment)
    }

    if (element.nodeType === 1) {
      element.innerHTML = ''
      element.appendChild(fragment)
    }
  }

  _computePositions (from = 1) {
    const config = this._config
    const total = config.total
    const reverse = config.reverse

    if (from < 1 && !reverse) {
      from = 1
    }

    for (let i = from; i < total; i++) {
      if (reverse) {
        if (i === 0) {
          this._itemPositions[0] = this._scrollHeight - this._itemHeights[0]
        } else {
          this._itemPositions[i] = this._itemPositions[i - 1] - this._itemHeights[i]
        }
      } else {
        this._itemPositions[i] = this._itemHeights[i - 1] + this._itemPositions[i - 1]
      }
    }
  }

  _computeScrollHeight () {
    const config = this._config
    const isHoriz = Boolean(config.horizontal)
    const total = config.total
    const scrollHeight = this._itemHeights.reduce((a, b) => a + b, 0)

    config.mergeStyle(this._scroller, {
      opacity: 0,
      position: 'absolute',
      [isHoriz ? 'height' : 'width']: '1px',
      [isHoriz ? 'width' : 'height']: `${scrollHeight}px`
    })

    // Calculate the height median
    const sortedItemHeights = this._itemHeights.slice(0).sort((a, b) => a - b)
    const middle = Math.floor(total / 2)
    const averageHeight = total % 2 === 0 ? (sortedItemHeights[middle] + sortedItemHeights[middle - 1]) / 2 : sortedItemHeights[middle]

    const clientProp = isHoriz ? 'clientWidth' : 'clientHeight'
    const containerHeight = this._element[clientProp] ? this._element[clientProp] : this._containerSize
    this._screenItemsLen = Math.ceil(containerHeight / averageHeight)
    this._containerSize = containerHeight

    // Cache 3 times the number of items that fit in the container viewport.
    this._cachedItemsLen = Math.max(this._cachedItemsLen || 0, this._screenItemsLen * 3)
    this._averageHeight = averageHeight

    if (config.reverse) {
      window.requestAnimationFrame(() => {
        if (isHoriz) {
          this._element.scrollLeft = scrollHeight
        } else {
          this._element.scrollTop = scrollHeight
        }
      })
    }

    return scrollHeight
  }

  _getFrom (scrollTop) {
    let i = 0

    while (this._itemPositions[i] < scrollTop) {
      i++
    }

    return i
  }

  _getReverseFrom (scrollTop) {
    let i = this._config.total - 1

    while (i > 0 && this._itemPositions[i] < scrollTop + this._containerSize) {
      i--
    }

    return i
  }
}
