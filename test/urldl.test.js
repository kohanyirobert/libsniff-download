var accum = require('accum')
var assert = require('chai').assert
var sinon = require('sinon')
var urldl = require('../lib/urldl')

describe('urldl.js', function() {
  it('should be able to fetch data from a url', function(done) {
    var out = accum.string(function(txt) {
      assert.include(txt, 'DO WHAT THE FUCK YOU WANT TO')
      done()
    })
    urldl('http://www.wtfpl.net/txt/copying/', out)
  })
})
