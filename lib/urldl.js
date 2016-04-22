var request = require('request')

var doStream = function(url, out) {
  request(url).pipe(out)
}

module.exports = doStream
