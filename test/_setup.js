const Document = require('stringdom');

// Set up a pretend DOM for the tests.
global.document = new Document();
global.document.body = document.createElement('body');
global.document.createComment = function() {
  return document.createElement('noscript');
};

// Ensure (request|cancel)AnimationFrame is a thing.
global.requestAnimationFrame = fn => setTimeout(fn, 10);
global.cancelAnimationFrame = timeout => clearTimeout(timeout);
