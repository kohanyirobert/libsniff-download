var Decompress = require('decompress')
var mkdirp = require('mkdirp')
var path = require('path')
var vargs = require('vargs-callback')
var rimraf = require('rimraf')
var request = require('request')
var fs = require('fs')
var _ = require('lodash')

var getPath = function(opts, target) {
  return path.join(opts.dir, opts.getDest(target))
}

var doDecompress = function(opts, target, cb) {
  new Decompress()
    .src(getPath(opts, target))
    .dest(opts.dir)
    .use(Decompress.zip())
    .run(function(err, files) {
      if (err) {
        throw new Error(err)
      }
      fs.unlink(getPath(opts, target))
      cb(files.map(function(file) {
        return file.path
      }))
    })
}

var doCollect = function(opts, target, downloads, files, cb) {
  downloads.push({
    target: target,
    files: files
  })
  if (downloads.length === opts.targets.length) {
    cb(downloads)
  }
}

var doCreate = function(opts, target, downloads, cb) {
  mkdirp(opts.dir, function() {
    var destPath = getPath(opts, target)
    var out = fs.createWriteStream(destPath)
    out.on('finish', function() {
      if (opts.archive) {
        doDecompress(opts, target, function(files) {
          doCollect(opts, target, downloads, files, cb)
        })
      } else {
        doCollect(opts, target, downloads, [path.resolve(destPath)], cb)
      }
    })
    request(opts.getUrl(target)).pipe(out)
  })
}

var doTargets = function(opts, cb) {
  var downloads = []
  opts.targets.forEach(function(target) {
    doCreate(opts, target, downloads, cb)
  })
}

var doCleanup = function(opts, cb) {
  rimraf(opts.dir, function() {
    doTargets(opts, cb)
  })
}

var doDownload = function(opts, cb) {
  if (!_.isPlainObject(opts)) throw TypeError('opts must be an object')
  if (!_.isFunction(cb)) throw TypeError('cb must be a function')
  if (!_.isArrayLikeObject(opts.targets)) throw TypeError('targets must be an array')
  if (!_.isString(opts.dir)) throw TypeError('dir must be a string')
  if (!_.isBoolean(opts.archive)) throw TypeError('archive flag must be a boolean')
  if (!_.isFunction(opts.getUrl)) throw TypeError('getUrl must be a function')
  if (!_.isFunction(opts.getDest)) throw TypeError('getDest must be a function')
  doCleanup(opts, cb)
}

module.exports = vargs(doDownload)
