var accum = require('accum')
var assert = require('chai').assert
var urldl = require('../lib/urldl')

describe('urldl.js', function() {
  it('should be able to fetch data from a url', function(done) {
    var out = accum.string(function(txt) {
      assert(txt.indexOf('DO WHAT THE FUCK YOU WANT TO') != -1)
      done()
    })
    urldl('http://www.wtfpl.net/txt/copying/', out)
  })
})
