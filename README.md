## HyperList

[![Build Status](https://travis-ci.org/tbranyen/hyperlist.svg?branch=master)](https://travis-ci.org/tbranyen/hyperlist)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This is a simple component that can be dropped into any JavaScript application
and provide a virtual scrolling area that is highly performant and lightweight.
With zero dependencies and well under 300 lines of code sans comments, it is
easy to understand and use.

## Demo

![Demo](/example.gif?raw=true)

- [Basic example](http://tbranyen.github.io/hyperlist/examples/basic.html)
- [React integration](http://tbranyen.github.io/hyperlist/examples/react-example.html)
- [Bind to input range](http://tbranyen.github.io/hyperlist/examples/bind-scroll-to-range.html)
- [2 Million Rows](http://tbranyen.github.io/hyperlist/examples/2-million-rows.html)
  - May take a minute to generate the data before anything shows up...
- [Large Chat History](http://tbranyen.github.io/hyperlist/examples/large-chat-history.html)
  - May take a minute to generate the data before anything shows up...

## Installation

```sh
npm install hyperlist
```

Of course it can also just be added to any JavaScript project since it consists
of a single JavaScript file.

## Usage

Below are full code examples containing typical usage. Documentation
supplements the code comments so hopefully everything makes sense!

#### Invocation

How to invoke an instance of HyperList

``` javascript
// Using create
const list = HyperList.create(document.body, requiredOptions);

// Using new
const list = new HyperList(document.body, requiredOptions);
```

#### Required Options

These configuration options are not optional. So set them to avoid runtime
errors. You can mutate them by setting a new object in the refresh method.

``` javascript
list.refresh(element, newConfig);
```

- `itemHeight` A single value that is the height for every single element in
  the list.
- `total` The number of items in the list.
- `generate` A function that is called with the index to render. You return an
  element to render in that position.

#### Basic example

A simple example with just the required options.

``` javascript
// Create a container element or find one that already exists in the DOM.
const container = document.createElement('div');

// Pass the container element and configuration to the HyperList constructor.
// You can optionally use the create method if you prefer to avoid `new`.
const list = HyperList.create(container, {
  // All items must be the exact same height currently. Although since there is
  // a generate method, in the future this should be configurable.
  itemHeight: 30,

  // Specify the total amount of items to render the virtual height.
  total: 10000,

  // Wire up the data to the index. The index is then mapped to a Y position
  // in the container.
  generate(index) {
    const el = document.createElement('div');
    el.innerHTML = `ITEM ${index + 1}`;
    return el;
  },
});

// Attach the container to the DOM.
document.body.appendChild(container);
```

#### Optional Options

These configuration options are totally optional. So set them when you need to
go beyond the defaults and required options.

- `reverse` This will render items from the bottom of the container instead of
  the top. This works much better for chat and notifications experiences. This
  option will automatically scroll the container to the bottom every time the
  refresh method is called and during instantiation.
- `horizontal` Change the rendering orientation to horizontal
- `width` The container width as a number or string (defaults to `100%`)
- `height` The container height as a number or string (defaults to `100%`)
- `scrollerTagName` Is a TR by default which works fine in most cases. If you
  need a different element tag name, specify it here.
- `rowClassName` Any custom classes to add to the row.
- `overrideScrollPosition` Pull the scrollTop value from somewhere else, this
  allows for binding range elements to the scroll position.
- `applyPatch` Is called with the container element and the DocumentFragment
  which contains all the items being added. You can implement Virtual DOM
  patching with this hook.
- `afterRender` - Triggered after `applyPatch` has returned.
- `scroller` - Specify an element to be in the place of the scroller.
- `useFragment` - Determines if a fragment is used internally or not, defaults
  to true.

#### Variable height items

When you are rendering a list of elements that have variable heights you may
specific an object as the `generate` callback's return value that contains
the signature: `{ element: domNode, height: 100 }`.

For example:

``` js
// Wire up the data to the index. The index is then mapped to a Y position
// in the container, using some height.
generate(index) {
  const el = document.createElement('div');
  el.innerHTML = `ITEM ${index + 1}`;
  return { element: el, height: Math.random() * 1000 };
}
```

You can also find a [working implementation in the examples directory](./examples/dynamic-height.html).

#### Advanced example

An example with all the options, mounted to the entire page that refreshes when
the browser resizes.

``` javascript
// Create a container element or find one that already exists in the DOM.
const container = document.createElement('div');

const config = {
  width: '100%',
  height: window.innerHeight,

  // All items must be the exact same height currently. Although since there is
  // a generate method, in the future this should be configurable.
  itemHeight: 30,

  // Specify the total amount of items to render the virtual height.
  total: 10000,

  // Reverse the list to start from the bottom instead of the top.
  reverse: true,
  
  // Customize the scroller tag name, defaults to tr.
  scrollerTagName: 'tr',

  // Or if you want, you can specify an element which has higher precedence.
  scroller: document.createElement('tr'),

  // Customize the virtual row class, defaults to vrow.
  rowClassName: 'vrow',

  // Whether or not childNodes are built up in an Array or Document Fragment.
  useFragment: false,

  // By default HyperList will determine scroll offset from the container
  // element. You can override this lookup by using this hook.
  overrideScrollPosition() {
    return document.body.scrollTop;
  },

  // Wire up the data to the index. The index is then mapped to a Y position
  // in the container.
  generate(index) {
    const el = document.createElement('div');
    el.innerHTML = `ITEM ${index + 1}`;
    return el;
  },

  // Triggerd after any items have been added into the DOM.
  afterRender() {
    console.log('Rendered some items');
  },

  // If you want to do some custom rendering with the container element and
  // the fragment, you can specify this method. The contents of this function
  // are the defaults. Look at examples/diffhtml.html for an example of using
  // this method with a Virtual DOM.
  applyPatch(element, fragment) {
    element.innerHTML = '';
    element.appendChild(fragment);
  },
};

// Pass the container element and configuration to the HyperList constructor.
// You can optionally use the create method if you prefer to avoid `new`.
const list = HyperList.create(container, config);

window.onresize = () => {
  config.height = window.innerHeight;
  list.refresh(container, config);
};

// Attach the container to the DOM.
document.body.appendChild(container);
```

## Contributing

PRs are welcome, please ensure the tests pass and the code looks like the
surrounding style:

``` sh
npm test
```

## Credits

This project is a fork of the existing (unmaintained) project:
https://github.com/sergi/virtual-list

This README section, the LICENSE, and package.json will remain to ensure
proper credit is always extended.
