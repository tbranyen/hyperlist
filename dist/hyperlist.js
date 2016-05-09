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

// Private class properties.
var _config = Symbol('config');
var _element = Symbol('element');
var _scroller = Symbol('scroller');
var _renderAnimationFrame = Symbol('renderAnimationFrame');
var _renderChunk = Symbol('renderChunk');
var _screenItemsLen = Symbol('screenItemsLen');
var _cachedItemsLen = Symbol('cachedItemsLen');
var _lastRepaint = Symbol('lastRepaint');
var _getRow = Symbol('getRow');
var _getScrollPosition = Symbol('getScrollPosition');

var HyperList = function () {
  _createClass(HyperList, null, [{
    key: 'create',
    value: function create(element, userProvidedConfig) {
      return new HyperList(element, userProvidedConfig);
    }
  }, {
    key: 'maxElementHeight',
    get: function get() {
      var wrapper = document.createElement('div');
      var fixture = document.createElement('div');

      wrapper.style = 'position: absolute; height: 1px; opacity: 0;';
      fixture.style = 'height: 1000000000px;';

      wrapper.appendChild(fixture);

      document.body.appendChild(wrapper);
      var retVal = fixture.offsetHeight;
      document.body.removeChild(wrapper);

      return retVal;
    }
  }]);

  function HyperList(element) {
    var _this = this;

    var userProvidedConfig = arguments.length <= 1 || arguments[1] === undefined ? defaultConfig : arguments[1];

    _classCallCheck(this, HyperList);

    this[_config] = {};
    this[_lastRepaint] = 0;

    this.refresh(element, userProvidedConfig);

    var config = this[_config];
    var context = { scrollTop: 0 };

    if (config.reverse) {
      requestAnimationFrame(function () {
        element.scrollTop = (config.total - 1) * config.itemHeight;
      });
    }

    // Create internal render loop.
    var render = function render() {
      var scrollTop = _this[_getScrollPosition]();
      var screenItemsLen = _this[_screenItemsLen];
      var maxBuffer = screenItemsLen * config.itemHeight;
      var lastRepaint = _this[_lastRepaint];

      _this[_renderAnimationFrame] = requestAnimationFrame(render);

      if (scrollTop === lastRepaint) {
        return;
      } else if (!lastRepaint || Math.abs(scrollTop - lastRepaint) > maxBuffer) {
        _this[_renderChunk]();
        _this[_lastRepaint] = scrollTop;

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
      cancelAnimationFrame(this[_renderAnimationFrame]);
    }
  }, {
    key: 'refresh',
    value: function refresh(element, userProvidedConfig) {
      Object.assign(this[_config], defaultConfig, userProvidedConfig);

      if (!element || element.nodeType !== 1) {
        throw new Error('HyperList requires a valid DOM Node container');
      }

      this[_element] = element;

      var config = this[_config];

      var scroller = this[_scroller] || document.createElement(config.scrollerTagName || 'tr');

      if (!config.generate) {
        throw new Error('Missing required `generate` function');
      }

      if (Number(config.total) !== Number(config.total)) {
        throw new Error('Invalid required `total` value, expected number');
      }

      // Width and height should be coerced to string representations. Either in
      // `%` or `px`.
      Object.keys(defaultConfig).filter(function (prop) {
        return prop in config;
      }).forEach(function (prop) {
        var value = config[prop];

        if (typeof value !== 'string' && typeof value !== 'number') {
          var msg = 'Invalid optional `' + prop + '`, expected string or number';
          throw new Error(msg);
        } else if (typeof value === 'number' || value.slice(-1) !== '%') {
          config[prop] = value + 'px';
        }
      });

      // Decorate the container element with inline styles that will match
      // the user supplied configuration.
      element.setAttribute('style', '\n      width: ' + config.width + ';\n      height: ' + config.height + ';\n      overflow: auto;\n      position: relative;\n      padding: 0;\n    ');

      var scrollerHeight = config.itemHeight * config.total;
      var maxElementHeight = HyperList.maxElementHeight;

      if (scrollerHeight > maxElementHeight) {
        console.warn(['HyperList: The maximum element height ' + maxElementHeight + 'px has', 'been exceeded; please reduce your item height.'].join());
      }

      scroller.setAttribute('style', '\n      opacity: 0;\n      position: absolute;\n      width: 1px;\n      height: ' + scrollerHeight + 'px;\n    ');

      // Only append the scroller element once.
      if (!this[_scroller]) {
        element.appendChild(scroller);
      }

      var height = userProvidedConfig.height;
      var elementHeight = element.offsetHeight;
      var resolvedHeight = typeof height === 'string' ? elementHeight : height;

      this[_screenItemsLen] = Math.ceil(resolvedHeight / config.itemHeight);
      // Cache 4 times the number of items that fit in the container viewport.
      this[_cachedItemsLen] = this[_screenItemsLen] * 3;

      // Set the scroller instance.
      this[_scroller] = scroller;

      // Render after refreshing.
      this[_renderChunk]();
    }
  }, {
    key: _getRow,
    value: function value(i) {
      var config = this[_config];
      var reverse = config.reverse;
      var total = config.total;
      var item = config.generate(i);
      var itemHeight = config.itemHeight;

      if (!item || item.nodeType !== 1) {
        throw new Error('Generator did not return a DOM Node for index: ' + i);
      }

      item.classList.add(config.rowClassName || 'vrow');

      var offsetTop = i * itemHeight;
      var top = reverse ? (total - 1) * itemHeight - offsetTop : offsetTop;

      item.setAttribute('style', 'position: absolute; top: ' + top + 'px');

      return item;
    }
  }, {
    key: _getScrollPosition,
    value: function value() {
      var config = this[_config];

      if (typeof config.overrideScrollPosition === 'function') {
        return config.overrideScrollPosition();
      }

      return this[_element].scrollTop;
    }
  }, {
    key: _renderChunk,
    value: function value() {
      var config = this[_config];
      var element = this[_element];
      var scrollTop = this[_getScrollPosition]();
      var screenItemsLen = this[_screenItemsLen];
      var getRow = this[_getRow].bind(this);
      var total = config.total;
      var itemHeight = config.itemHeight;
      var estFrom = Math.floor(scrollTop / itemHeight) - screenItemsLen;
      var from = estFrom > total ? total : estFrom < 0 ? 0 : estFrom;
      var estTo = from + this[_cachedItemsLen];
      var to = estTo > total ? total : estTo < 0 ? 0 : estTo;

      // Append all the new rows in a document fragment that we will later append
      // to the parent node
      var fragment = document.createDocumentFragment();

      this[_scroller] = this[_scroller].cloneNode();

      // Keep the scroller in the list of children.
      fragment.appendChild(this[_scroller]);

      for (var i = from; i < to; i++) {
        fragment.appendChild(getRow(config.reverse ? config.total - 1 - i : i));
      }

      if (config.applyPatch) {
        return config.applyPatch(element, fragment);
      }

      element.innerHTML = '';
      element.appendChild(fragment);
    }
  }]);

  return HyperList;
}();

exports.default = HyperList;

},{}]},{},[1])(1)
});