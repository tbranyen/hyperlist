"use strict";

/**
 * Creates a virtually-rendered scrollable list.
 * @param config {object}
 * @constructor
 */
function ScrollableList(config) {
  var width = (config && config.w + "px") || "100%";
  var height = (config && config.h + "px") || "100%";
  var itemHeight = this.itemHeight = config.itemHeight;

  this.items = config.items;

  var totalHeight = itemHeight * this.items.length;
  this.scroller = ScrollableList.createScroller(totalHeight);
  this.container = ScrollableList.createContainer(width, height);

  var screenItemsLen = Math.ceil(config.h / itemHeight);
  // Cache 4 times the number of items that fit in the container viewport
  var cachedItemsLen = screenItemsLen * 4;
  this.renderChunk(this.container, 0, cachedItemsLen / 2);

  var lastRepaintY;
  var self = this;
  function onScroll(e) {
    var scrollTop = e.target.scrollTop;
    var first = parseInt(scrollTop / itemHeight);
    if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > screenItemsLen * 3 * itemHeight) {
      self.renderChunk(self.container, first, cachedItemsLen);
      lastRepaintY = scrollTop;
    }

    e.preventDefault && e.preventDefault();
  }
  this.container.addEventListener("scroll", onScroll);
};

ScrollableList.prototype.renderChunk = function(node, fromPos, howMany) {
  var fragment = document.createDocumentFragment();
  fragment.appendChild(this.scroller);
  for (var i = fromPos; i < fromPos + howMany; i++) {
    var item = this.items[i];
    if (!item)
      break;

    item.style.top = (i * this.itemHeight) + "px";
    fragment.appendChild(item);
  }

  if (fragment.childNodes.length > 0)
    node.appendChild(fragment);
};

ScrollableList.createContainer = function(w, h) {
  var c = document.createElement("div");
  c.style.width = w;
  c.style.height = h;
  c.style.overflow = "auto";
  c.style.position = "relative";
  c.style.padding = 0;
  c.style.border = "1px solid black";
  return c;
};

ScrollableList.createScroller = function(h) {
  var scroller = document.createElement("div")
  scroller.style.opacity = "0";
  scroller.style.position = "absolute";
  scroller.style.top = "0px";
  scroller.style.left = "0px";
  scroller.style.width = "1px";
  scroller.style.height = h + "px";
  return scroller;
}
