var Decompress = require('decompress')
var _ = require('lodash')
var async = require('async')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf')
var vargs = require('vargs-callback')

module.exports = function(urldl) {
  var validTargets = [
    'linux-ia32',
    'linux-x64',
    'win32-ia32',
    'win32-x64',
    'darwin-x64'
  ]

  var isValidTarget = function(target) {
    return _.findIndex(validTargets, function(validTarget) {
      return validTarget === target
    }) > -1
  }

  var getDestDir = function(opts, target) {
    if (opts.targetDir) {
      return path.join(opts.dir, target)
    }
    return opts.dir
  }

  var getDestPath = function(opts, target) {
    return path.join(getDestDir(opts, target), opts.getDestName(target))
  }

  var doDecompress = function(opts, target, cb) {
    var targetPath = getDestPath(opts, target)
    new Decompress()
      .src(targetPath)
      .dest(getDestDir(opts, target))
      .use(Decompress.zip())
      .run(function(err, files) {
        if (err) {
          throw new Error(err)
        }
        fs.unlink(targetPath)
        var filePaths = files.map(function(file) {
          return file.path
        })
        async.filter(filePaths, function(filePath, callback) {
            fs.stat(filePath, function(err, stats) {
              if (err) {
                callback(err, null)
              } else {
                callback(null, stats.isFile())
              }
            })
          }, function(err, filteredFilePaths) {
          if (err) {
            throw new Error(err)
          }
          cb(filteredFilePaths)
        })
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
    mkdirp(getDestDir(opts, target), function() {
      var destPath = getDestPath(opts, target)
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
      urldl(opts.getUrl(target), out)
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
    opts.targets.forEach(function(target) {
      if (!_.isString(target)) throw TypeError('targets must be strings')
      if (!isValidTarget(target)) throw Error('targets must be valid')
    })
    if (!_.isString(opts.dir)) throw TypeError('dir must be a string')
    if (!_.isBoolean(opts.targetDir)) throw TypeError('targetDir flag must be a boolean')
    if (!_.isBoolean(opts.archive)) throw TypeError('archive flag must be a boolean')
    if (!_.isFunction(opts.getUrl)) throw TypeError('getUrl must be a function')
    if (!_.isFunction(opts.getDestName)) throw TypeError('getDestName must be a function')
    doCleanup(opts, cb)
  }

  return vargs(doDownload)
}
