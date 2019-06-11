const Document = require('stringdom')

global.window = {}

// Set up a pretend DOM for the tests.
global.document = new Document()
global.document.body = document.createElement('body')
global.document.createComment = function () {
  return document.createElement('noscript')
}

// Ensure (request|cancel)AnimationFrame is a thing.
window.requestAnimationFrame = fn => setTimeout(fn, 10)
window.cancelAnimationFrame = timeout => clearTimeout(timeout)

// Ensure getComputedStyle is a thing.
window.getComputedStyle = () => ({
  getPropertyValue: () => '0px'
})
