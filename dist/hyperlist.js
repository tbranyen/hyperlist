(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.HyperList = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

// Default configuration.

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultConfig = {
  width: '100%',
  height: '100%'
};

// Check for valid number.
var isNumber = function isNumber(input) {
  return Number(input) === Number(input);
};

/**
 * Creates a HyperList instance that virtually scrolls very large amounts of
 * data effortlessly.
 */

var HyperList = function () {
  _createClass(HyperList, null, [{
    key: 'create',
    value: function create(element, userProvidedConfig) {
      return new HyperList(element, userProvidedConfig);
    }
  }, {
    key: 'getMaxBrowserHeight',
    value: function getMaxBrowserHeight() {
      // Create two elements, the wrapper is `1px` tall and is transparent and
      // positioned at the top of the page. Inside that is an element that gets
      // set to 1 billion pixels. Then reads the max height the browser can
      // calculate.
      var wrapper = document.createElement('div');
      var fixture = document.createElement('div');

      // As said above, these values get set to put the fixture elements into the
      // right visual state.
      wrapper.style = 'position: absolute; height: 1px; opacity: 0;';
      fixture.style = 'height: 1000000000px;';

      // Add the fixture into the wrapper element.
      wrapper.appendChild(fixture);

      // Apply to the page, the values won't kick in unless this is attached.
      document.body.appendChild(wrapper);

      // Get the maximum element height in pixels.
      var maxElementHeight = fixture.offsetHeight;

      // Remove the element immediately after reading the value.
      document.body.removeChild(wrapper);

      return maxElementHeight;
    }
  }]);

  function HyperList(element, userProvidedConfig) {
    var _this = this;

    _classCallCheck(this, HyperList);

    this._config = {};
    this._lastRepaint = null;
    this._maxElementHeight = HyperList.getMaxBrowserHeight();

    this.refresh(element, userProvidedConfig);

    var config = this._config;

    if (config.reverse) {
      window.requestAnimationFrame(function () {
        element.scrollTop = config.total * config.itemHeight;
      });
    }

    // Create internal render loop.
    var render = function render() {
      var scrollTop = _this._getScrollPosition();
      var screenItemsLen = _this._screenItemsLen;
      var maxBuffer = screenItemsLen * config.itemHeight;
      var lastRepaint = _this._lastRepaint;

      _this._renderAnimationFrame = window.requestAnimationFrame(render);

      if (scrollTop === lastRepaint) {} else if (!lastRepaint || Math.abs(scrollTop - lastRepaint) > maxBuffer) {
        _this._renderChunk();
        _this._lastRepaint = scrollTop;

        if (typeof config.afterRender === 'function') {
          config.afterRender();
        }
      }
    };

    render();
  }

  _createClass(HyperList, [{
    key: 'destroy',
    value: function destroy() {
      window.cancelAnimationFrame(this._renderAnimationFrame);
    }
  }, {
    key: 'refresh',
    value: function refresh(element, userProvidedConfig) {
      Object.assign(this._config, defaultConfig, userProvidedConfig);

      if (!element || element.nodeType !== 1) {
        throw new Error('HyperList requires a valid DOM Node container');
      }

      this._element = element;

      var config = this._config;

      var scroller = this._scroller || config.scroller || document.createElement(config.scrollerTagName || 'tr');

      // Default configuration option `useFragment` to `true`.
      if (typeof config.useFragment !== 'boolean') {
        this._config.useFragment = true;
      }

      if (!config.generate) {
        throw new Error('Missing required `generate` function');
      }

      if (!isNumber(config.total)) {
        throw new Error('Invalid required `total` value, expected number');
      }

      if (!Array.isArray(config.itemHeight) && !isNumber(config.itemHeight)) {
        throw new Error('\n        Invalid required `itemHeight` value, expected number or array\n      '.trim());
      } else if (isNumber(config.itemHeight)) {
        this._itemHeights = Array(config.total).fill(config.itemHeight);
      } else {
        this._itemHeights = config.itemHeight;
      }

      // Reuse the item positions if refreshed, otherwise set to empty array.
      this._itemPositions = this._itemPositions || [];

      // Each index in the array should represent the position in the DOM.
      this._calculatePositions(0);

      // Width and height should be coerced to string representations. Either in
      // `%` or `px`.
      Object.keys(defaultConfig).filter(function (prop) {
        return prop in config;
      }).forEach(function (prop) {
        var value = config[prop];

        if (!value) {
          return;
        } else if (typeof value !== 'string' && typeof value !== 'number') {
          var msg = 'Invalid optional `' + prop + '`, expected string or number';
          throw new Error(msg);
        } else if (isNumber(value) || value.slice(-1) !== '%') {
          config[prop] = value + 'px';
        }
      });

      // Decorate the container element with inline styles that will match
      // the user supplied configuration.
      element.setAttribute('style', '\n      width: ' + config.width + ';\n      height: ' + config.height + ';\n      overflow: auto;\n      position: relative;\n      padding: 0px;\n    ');

      var scrollerHeight = config.itemHeight * config.total;
      var maxElementHeight = this._maxElementHeight;

      if (scrollerHeight > maxElementHeight) {
        console.warn(['HyperList: The maximum element height', maxElementHeight + 'px has', 'been exceeded; please reduce your item height.'].join(' '));
      }

      scroller.setAttribute('style', '\n      opacity: 0;\n      position: absolute;\n      width: 1px;\n      height: ' + scrollerHeight + 'px;\n    ');

      // Only append the scroller element once.
      if (!this._scroller) {
        element.appendChild(scroller);
      }

      var height = userProvidedConfig.height;
      var elementHeight = element.offsetHeight;
      var resolvedHeight = typeof height === 'string' ? elementHeight : height;

      this._screenItemsLen = Math.ceil(resolvedHeight / config.itemHeight);
      // Cache 4 times the number of items that fit in the container viewport.
      this._cachedItemsLen = this._screenItemsLen * 3;

      // Set the scroller instance.
      this._scroller = scroller;

      // Render after refreshing.
      this._renderChunk();

      if (typeof config.afterRender === 'function') {
        config.afterRender();
      }
    }
  }, {
    key: '_calculatePositions',
    value: function _calculatePositions(startFrom) {
      var itemHeights = this._itemHeights;
      var itemPos = this._itemPositions;

      itemHeights.slice(startFrom).forEach(function (itemHeight, i) {
        console.log('Item Height: ' + itemHeight);
        var prevHeight = isNumber(itemPos[i - 1]) ? itemPos[i - 1] : -itemHeight;
        itemPos[i] = prevHeight + itemHeight;
      });
    }
  }, {
    key: '_getRow',
    value: function _getRow(i) {
      var config = this._config;
      var item = config.generate.apply(null, arguments);

      if (!item || item.nodeType !== 1) {
        throw new Error('Generator did not return a DOM Node for index: ' + i);
      }

      var oldClass = item.getAttribute('class') || '';
      item.setAttribute('class', oldClass + ' ' + (config.rowClassName || 'vrow'));

      return item;
    }
  }, {
    key: '_getScrollPosition',
    value: function _getScrollPosition() {
      var config = this._config;

      if (typeof config.overrideScrollPosition === 'function') {
        return config.overrideScrollPosition();
      }

      return this._element.scrollTop;
    }
  }, {
    key: '_renderChunk',
    value: function _renderChunk() {
      var _this2 = this;

      var config = this._config;
      var element = this._element;
      var scrollTop = this._getScrollPosition();
      var screenItemsLen = this._screenItemsLen;
      var getRow = this._getRow.bind(this);
      var total = config.total;
      var itemHeight = config.itemHeight;
      var estFrom = Math.floor(scrollTop / itemHeight) - screenItemsLen;
      var from = estFrom > total ? total : estFrom < 0 ? 0 : estFrom;
      var estTo = from + this._cachedItemsLen;
      var to = estTo > total ? total : estTo < 0 ? 0 : estTo;
      var fastCache = [];
      var state = { semaphore: null, isRendering: false };
      var arity = config.generate.length;

      // Append all the new rows in a document fragment that we will later append
      // to the parent node
      var fragment = config.useFragment ? document.createDocumentFragment() : []
      // Sometimes you'll pass fake elements to this tool and Fragments require
      // real elements.


      // The element that forces the container to scroll.
      ;var scroller = this._scroller;

      // Keep the scroller in the list of children.
      fragment[config.useFragment ? 'appendChild' : 'push'](scroller);

      state.isRendering = true;

      var _loop = function _loop(i) {
        var updateIndex = function updateIndex(newHeight) {
          state.semaphore--;

          if (!isNumber(newHeight)) {
            return;
          }
          _this2._itemHeights[i] = newHeight;

          // Render the new positions.
          if (!state.isRendering && !state.semaphore) {
            _this2._applyPositions(from, to, fastCache);
          }
        };

        if (arity > 1) {
          state.semaphore = !state.semaphore ? 0 : ++state.semaphore;
        }

        var row = getRow.apply(_this2, [config.reverse ? config.total - 1 - i : i, arity > 1 ? updateIndex : undefined]);

        fastCache[i] = row;
        fragment[config.useFragment ? 'appendChild' : 'push'](row);
      };

      for (var i = from; i < to; i++) {
        _loop(i);
      }

      state.isRendering = false;

      // Set the positions for the first (and hopefully last) time.
      this._applyPositions(from, to, fastCache);

      if (config.applyPatch) {
        return config.applyPatch(element, fragment);
      }

      element.innerHTML = '';
      element.appendChild(fragment);
    }
  }, {
    key: '_applyPositions',
    value: function _applyPositions(from, to, fastCache) {
      this._calculatePositions(from);

      var config = this._config;
      var reverse = config.reverse;
      var itemPositions = this._itemPositions;

      for (var i = from; i < to; i++) {
        var item = fastCache[i];
        var offsetTop = itemPositions[i];
        var top = reverse ? itemPositions.slice(-1) - offsetTop : offsetTop;

        item.setAttribute('style', '\n        ' + (item.style.cssText || '') + '\n        position: absolute;\n        top: ' + top + 'px\n      ');
      }
    }
  }]);

  return HyperList;
}();

exports.default = HyperList;
module.exports = exports['default'];

},{}]},{},[1])(1)
});