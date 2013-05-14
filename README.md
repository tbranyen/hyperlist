## Virtual DOM List

This virtual list is a simple component allows the developer to create massively
long lists (by list I mean a single column of rows, for now) that perform extremely
fast by loading just the part of the list showing up on the viewport, and by optimizing
the amount of DOM operations and reflows and spend very little memory.

The list could be done even faster by sacrificing the 'momentum' effect, but I
decided to keep it since it is too big of a sacrifice for the sake of speed.

## Installation

The virtual DOM list can be installed using bower:

    bower install virtual-list

Of course it can also just be added to any JavaScript project since it consists of a
single JavaScript file.

## Usage

Each of the following snippets of code creates a virtual list that holds 1 milion
rows:

```javascript
// This will create a scrolling list of 300x300 with 10000 rows. It is necessary to specify
// how tall each row is by setting the `itemHeight` prpoerty in the config object. In this
// example, we set up a generator function that will generate each row on demand.
var list = new ScrollableList({
  w: 300,
  h: 300,
  itemHeight: 31,
  totalRows: 10000,
  generatorFn: function(row) {
    var el = document.createElement("div");
    el.innerHTML = "ITEM " + row;
    el.style.borderBottom = "1px solid red";
    el.style.position = "absolute"
    return el;
  }
});
document.body.appendChild(list.container)

// The code below will create an array of 10000 DOM elements beforehand and pass them to
// the list. The Virtual list will then display them on demand. Of course, even if the
// virtual list is smart about displaying them, this method fills up a lot of memory by 
// creating the elements before-hand.
var bigAssList = [];
for (var i = 0; i < 10000; i++) {
  var el = document.createElement("div");
  el.classList.add("item");
  el.innerHTML = "ITEM " + i;
  el.style.borderBottom = "1px solid red";
  bigAssList.push(el);
}

var list = new ScrollableList({
  w: 300,
  h: 300,
  items: bigAssList,
  itemHeight: 31
});
document.body.appendChild(list.container)

// The code below will create an array of 10000 strings beforehand and pass them to
// the list. The Virtual list will then display them on demand.
var bigAssList = [];
for (var i = 0; i < 10000; i++)
  bigAssList.push("ITEM " + i);

var list = new ScrollableList({
  w: 300,
  h: 300,
  items: bigAssList,
  itemHeight: 31
});
document.body.appendChild(list.container)
```

## Caveats

Firefox has a nasty bug (https://bugzilla.mozilla.org/show_bug.cgi?id=373875)
that breaks any attempt od assigning big numerical values to css properties.
Since the virtual list does exactly that to give the illusion of a very big list
without actually loading the components, you might run into that bug for very big
lists. Unfortunately, I haven't found a way to work around it yet.

## License

The MIT License (MIT)

Copyright (C) 2013 Sergi Mansilla

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
