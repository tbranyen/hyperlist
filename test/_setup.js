const Document = require('stringdom');

// Set up a pretend DOM for the tests.
global.document = new Document();
global.document.body = document.createElement('body');

// Ensure requestAnimationFrame is a thing.
global.requestAnimationFrame = fn => setTimeout(fn, 100);
