var tieFile = require('../')

var hosts = tieFile('hosts')

var host = process.argv[2]
var ip = process.argv[3]

if (!host) {
  console.error("host argument is required");
  process.exit(1)
}

if (!ip) ip = '127.0.0.1';

var matched = false
hosts.forEach(function (line) {
  if (line.match(ip)) {
    matched = true
    if (!line.match(host)) {
      line.append(' ', host)
    }
  }
})

if (!matched) hosts.push([ip, host].join('\t'))
