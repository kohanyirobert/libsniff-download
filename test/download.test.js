var _ = require('lodash')
var assert = require('chai').assert
var fs = require('fs')
var path = require('path')
var tmp = require('tmp')
var urlparse = require('url').parse
var download = require('../lib/download')

var stubUrldl = function(url, out) {
  fs.createReadStream(path.join('etc', urlparse(url).pathname)).pipe(out)
}

var cb = function() {}
var targets = ['win32-ia32', 'linux-x64']

var fails = function(type, opts, cb, msg) {
  var downloader = download(stubUrldl)
  var fn = downloader.bind(null, opts, cb)
  assert.throws(fn, type, msg)
}

describe('download.js', function() {
  describe('required parameters', function() {
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

    it('should fail if targets are not strings', function() {
      [[undefined], [null], [42]].forEach(function(value) {
        fails(TypeError, {targets: value}, cb, 'targets must be strings')
      })
    })

    it('should fail if targets are not valid', function() {
      [[''], ['target'], ['darwin-ia32']].forEach(function(value) {
        fails(Error, {targets: value}, cb, 'targets must be valid')
      })
    })

    it('should fail if dir is not a string', function() {
      [undefined, null, 42, targets].forEach(function(value) {
        fails(TypeError, {targets: targets, dir: value}, cb, 'dir must be a string')
      })
    })

    it('should fail if targetDir is not a boolean', function() {
      [undefined, null, 42, 'archive'].forEach(function(value) {
        fails(TypeError, {
          targets: targets,
          dir: '.',
          targetDir: value
        }, cb, 'targetDir flag must be a boolean')
      })
    })


    it('should fail if archive is not a boolean', function() {
      [undefined, null, 42, 'archive'].forEach(function(value) {
        fails(TypeError, {
          targets: targets,
          dir: '.',
          targetDir: true,
          archive: value
        }, cb, 'archive flag must be a boolean')
      })
    })

    it('should fail if getUrl is not a boolean', function() {
      [undefined, null, 42, 'getUrl'].forEach(function(value) {
        fails(TypeError, {
          targets: targets,
          dir: '.',
          targetDir: true,
          archive: false,
          getUrl: value
        }, cb, 'getUrl must be a function')
      })
    })

    it('should fail if getDestName is not a boolean', function() {
      [undefined, null, 42, 'getDestName'].forEach(function(value) {
        fails(TypeError, {
          targets: targets,
          dir: '.',
          targetDir: true,
          archive: false,
          getUrl: function() {},
          getDestName: value
        }, cb, 'getDestName must be a function')
      })
    })
  })

  describe('binary and archived binary downloads', function() {
    beforeEach(function() {
      var self = this

      this.tmpobj = tmp.dirSync({unsafeCleanup: true})

      this.opts = {
        targets: targets,
        dir: self.tmpobj.name,
        getUrl: function(target) {
          return 'http://localhost/' + this.getDestName(target)
        }
      }

      this.assertDownloads = function(done) {
        return function(downloads) {
          assert.equal(targets.length, downloads.length)
          targets.forEach(function(target) {
            var download = downloads.find(function(download) {
              return download.target === target
            })
            assert.equal(download.files.length, 1)
            download.files.forEach(function(file) {
              assert.equal(file, path.resolve(path.join(self.tmpobj.name, target, 'binary')))
            })
          })
          done()
        }
      }
    })

    afterEach(function() {
      this.tmpobj.removeCallback()
    })

    it('should be able to download a binary', function(done) {
      var downloader = download(stubUrldl)
      downloader(_.defaults(this.opts, {
        targetDir: true,
        archive: false,
        getDestName: function(target) {
          return 'binary'
        }
      }), this.assertDownloads(done))
    })

    it('should be able to download an archive without inner target directory', function(done) {
      var downloader = download(stubUrldl)
      downloader(_.defaults(this.opts, {
        targetDir: true,
        archive: true,
        getDestName: function(target) {
          return 'binary.zip'
        }
      }), this.assertDownloads(done))
    })

    it('should be able to download an archive with inner target directory', function(done) {
      var downloader = download(stubUrldl)
      downloader(_.defaults(this.opts, {
        targetDir: false,
        archive: true,
        getDestName: function(target) {
          return target + '-binary.zip'
        }
      }), this.assertDownloads(done))
    })
  })
})
