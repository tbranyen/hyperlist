'use strict';

// Default configuration.
const defaultConfig = {
  width: '100%',
  height: '100%',
};

// Private class properties.
const _config = Symbol('config');
const _element = Symbol('element');
const _scroller = Symbol('scroller');
const _renderAnimationFrame = Symbol('renderAnimationFrame');
const _renderChunk = Symbol('renderChunk');
const _screenItemsLen = Symbol('screenItemsLen');
const _cachedItemsLen = Symbol('cachedItemsLen');
const _lastRepaint = Symbol('lastRepaint');
const _getRow = Symbol('getRow');
const _getScrollPosition = Symbol('getScrollPosition');

export default class HyperList {
  static create(element, userProvidedConfig) {
    return new HyperList(element, userProvidedConfig);
  }

  static get maxElementHeight() {
    const wrapper = document.createElement('div');
    const fixture = document.createElement('div');

    wrapper.style = 'position: absolute; height: 1px; opacity: 0;';
    fixture.style = 'height: 1000000000px;';

    wrapper.appendChild(fixture);

    document.body.appendChild(wrapper);
    const retVal = fixture.offsetHeight;
    document.body.removeChild(wrapper);

    return retVal;
  }

  constructor(element, userProvidedConfig=defaultConfig) {
    this[_config] = {};
    this[_lastRepaint] = 0;

    this.refresh(element, userProvidedConfig);

    const config = this[_config];
    const context = { scrollTop: 0 };

    if (config.reverse) {
      requestAnimationFrame(() => {
        element.scrollTop = (config.total - 1) * config.itemHeight;
      });
    }

    // Create internal render loop.
    const render = () => {
      const scrollTop = this[_getScrollPosition]();
      const screenItemsLen = this[_screenItemsLen];
      const maxBuffer = screenItemsLen * config.itemHeight;
      const lastRepaint = this[_lastRepaint];

      this[_renderAnimationFrame] = requestAnimationFrame(render);

      if (scrollTop === lastRepaint) {
        return;
      }
      else if (!lastRepaint || Math.abs(scrollTop - lastRepaint) > maxBuffer) {
        this[_renderChunk]();
        this[_lastRepaint] = scrollTop;

        if (typeof config.afterRender === 'function') {
          config.afterRender();
        }
      }
    };

    render();
  }

  destroy() {
    cancelAnimationFrame(this[_renderAnimationFrame]);
  }

  refresh(element, userProvidedConfig) {
    Object.assign(this[_config], defaultConfig, userProvidedConfig);

    if (!element || element.nodeType !== 1) {
      throw new Error('HyperList requires a valid DOM Node container');
    }

    this[_element] = element;

    const config = this[_config];

    const scroller = this[_scroller] || document.createElement(
      config.scrollerTagName || 'tr'
    );

    if (!config.generate) {
      throw new Error('Missing required `generate` function');
    }

    if (Number(config.total) !== Number(config.total)) {
      throw new Error('Invalid required `total` value, expected number');
    }

    // Width and height should be coerced to string representations. Either in
    // `%` or `px`.
    Object.keys(defaultConfig).filter(prop => prop in config).forEach(prop => {
      const value = config[prop];

      if (typeof value !== 'string' && typeof value !== 'number') {
        let msg = `Invalid optional \`${prop}\`, expected string or number`;
        throw new Error(msg);
      }

      else if (typeof value === 'number' || value.slice(-1) !== '%') {
        config[prop] = `${value}px`;
      }
    });

    // Decorate the container element with inline styles that will match
    // the user supplied configuration.
    element.setAttribute('style', `
      width: ${config.width};
      height: ${config.height};
      overflow: auto;
      position: relative;
      padding: 0;
    `);

    const scrollerHeight = config.itemHeight * config.total;
    const maxElementHeight = HyperList.maxElementHeight;

    if (scrollerHeight > maxElementHeight) {
      console.warn([
        'HyperList: The maximum element height ' + maxElementHeight + 'px has',
        'been exceeded; please reduce your item height.'
      ].join());
    }

    scroller.setAttribute('style', `
      opacity: 0;
      position: absolute;
      width: 1px;
      height: ${scrollerHeight}px;
    `);

    // Only append the scroller element once.
    if (!this[_scroller]) {
      element.appendChild(scroller);
    }

    const height = userProvidedConfig.height;
    const elementHeight = element.offsetHeight;
    const resolvedHeight = typeof height === 'string' ? elementHeight : height;

    this[_screenItemsLen] = Math.ceil(resolvedHeight / config.itemHeight);
    // Cache 4 times the number of items that fit in the container viewport.
    this[_cachedItemsLen] = this[_screenItemsLen] * 3;

    // Set the scroller instance.
    this[_scroller] = scroller;

    // Render after refreshing.
    this[_renderChunk]();
  }

  [_getRow](i) {
    const config = this[_config];
    const reverse = config.reverse;
    const total = config.total;
    const item = config.generate(i);
    const itemHeight = config.itemHeight;

    if (!item || item.nodeType !== 1) {
      throw new Error(`Generator did not return a DOM Node for index: ${i}`);
    }

    item.classList.add(config.rowClassName || 'vrow');

    const offsetTop = i * itemHeight;
    const top = reverse ? (total - 1) * itemHeight - offsetTop : offsetTop

    item.setAttribute('style', `position: absolute; top: ${top}px`);

    return item;
  }

  [_getScrollPosition]() {
    const config = this[_config];

    if (typeof config.overrideScrollPosition === 'function') {
      return config.overrideScrollPosition();
    }

    return this[_element].scrollTop;
  }

  [_renderChunk]() {
    const config = this[_config];
    const element = this[_element];
    const scrollTop = this[_getScrollPosition]();
    const screenItemsLen = this[_screenItemsLen];
    const getRow = this[_getRow].bind(this);
    const total = config.total;
    const itemHeight = config.itemHeight;
    const estFrom = Math.floor(scrollTop / itemHeight) - screenItemsLen;
    const from = estFrom > total ? total : estFrom < 0 ? 0 : estFrom;
    const estTo = from + this[_cachedItemsLen];
    const to = estTo > total ? total : estTo < 0 ? 0 : estTo;

    // Append all the new rows in a document fragment that we will later append
    // to the parent node
    const fragment = document.createDocumentFragment();

    this[_scroller] = this[_scroller].cloneNode();

    // Keep the scroller in the list of children.
    fragment.appendChild(this[_scroller]);

    for (let i = from; i < to; i++) {
      fragment.appendChild(getRow(config.reverse ? config.total - 1 - i : i));
    }

    if (config.applyPatch) {
      return config.applyPatch(element, fragment);
    }

    element.innerHTML = '';
    element.appendChild(fragment);
  }
}
