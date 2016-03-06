var assert = require('chai').assert
var download = require('./')
var pkg = require('./package.json')

var cb = function() {}

var fails = function(type, opts, cb, msg) {
  var fn = download.bind(null, opts, cb)
  assert.throws(fn, type, msg)
}

describe(pkg.name, function() {
  it('should fail if opts is not an object', function() {
    [undefined, null, 42, 'opts'].forEach(function(value) {
      fails(TypeError, value, undefined, 'opts must be an object')
    })
  })

  it('should fail if callback is not a function', function() {
    [undefined, null, 42, 'cb'].forEach(function(value) {
      fails(TypeError, {}, value, 'cb must be a function')
    })
  })

  it('should fail if targets is not an array', function() {
    [undefined, null, 42, 'targets'].forEach(function(value) {
      fails(TypeError, {targets: value}, cb, 'targets must be an array')
    })
  })

  it('should fail if dir is not a string', function() {
    [undefined, null, 42, []].forEach(function(value) {
      fails(TypeError, {targets: [], dir: value}, cb, 'dir must be a string')
    })
  })

  it('should fail if archive is not a boolean', function() {
    [undefined, null, 42, 'archive'].forEach(function(value) {
      fails(TypeError, {
        targets: [],
        dir: '.',
        archive: value
      }, cb, 'archive flag must be a boolean')
    })
  })

  it('should fail if getUrl is not a boolean', function() {
    [undefined, null, 42, 'getUrl'].forEach(function(value) {
      fails(TypeError, {
        targets: [],
        dir: '.',
        archive: false,
        getUrl: value
      }, cb, 'getUrl must be a function')
    })
  })

  it('should fail if getDestName is not a boolean', function() {
    [undefined, null, 42, 'getDestName'].forEach(function(value) {
      fails(TypeError, {
        targets: [],
        dir: '.',
        archive: false,
        getUrl: function() {},
        getDestName: value
      }, cb, 'getDestName must be a function')
    })
  })
})
