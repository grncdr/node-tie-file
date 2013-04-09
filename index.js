var fs = require('fs')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

module.exports = function (path, opts) {
  if (!opts) opts = {}
  if (fs.existsSync(path)) {
    var contents = fs.readFileSync(path, opts.encoding || 'utf-8');
  } else {
    var contents = null
  }
  return new File(path, contents, opts)
}

inherits(File, EventEmitter)
function File (path, rawData, opts) {
  this.separator = opts.separator || opts.recsep || "\n";
  this.path = path
  this.length = 0
  this.dirty = false
  this.lines = []
  this.lineChanged = mutator().bind(this)

  if (rawData) {
    this.dirty = true // prevent immediate write
    this.push.apply(this, rawData.split(this.separator))
    this.dirty = false
  }

  this.on('dirty', write)

  var writing = false
    , queuedWrite = false
    , self = this

  function write () {
    self.dirty = false
    if (writing && !queuedWrite) {
      queuedWrite = true
      self.once('drain', write)
    } else {
      writing = true
      fs.writeFile(self.path, self.toString(), function (err) {
        queuedWrite = writing = false
        if (err) self.emit('error', err)
        self.emit('drain')
      })
    }
  }
}

Object.getOwnPropertyNames(Array.prototype).forEach(function (method) {
  File.prototype[method] = function () {
    return this.lines[method].apply(this.lines, arguments)
  }
})

function createLine(file, line) {
  if (!(line instanceof Line)) {
    line = new Line(file, line)
  }
  return line.on('dirty', file.lineChanged)
}

function createLines(file, lines) {
  return [].slice.call(lines).map(function (line) { return createLine(file, line) })
}

['push', 'unshift'].forEach(function (method) {
  var original = Array.prototype[method]
  File.prototype[method] = mutator(function () {
    return this.length = original.apply(this.lines, createLines(this, arguments))
  })
});

['pop', 'shift'].forEach(function (method) {
  File.prototype[method] = mutator(function () {
    var line = this.lines[method]()
    line.removeListener('dirty', this.lineChanged)
    return line
  })
})

File.prototype.sort = mutator(function () {
  this.lines.sort.apply(this.lines, arguments)
  return this
})

File.prototype.reverse = mutator(function () {
  this.lines.reverse()
  return this
})

File.prototype.set = function (i, line) {
  return this.lines[i].swap(line)
}

File.prototype.get = function (i) {
  return this.lines[i]
}

File.prototype.splice = mutator(function (offset, howMany) {
  var added = arguments.length > 2
    ? createLines(this, [].slice.call(arguments, 2))
    : [];
  var args = [offset, howMany].concat(added);
  var removed = this.lines.splice.apply(this.lines, args);
  removed.forEach(function (line) {
    line.removeListener('dirty', this.lineChanged)
  }, this)
  this.length = this.lines.length;
  return removed
})

File.prototype.toString = function () {
  return this.lines.join(this.separator)
}

File.prototype.toJSON = function () {
  return this.lines
}

inherits(Line, EventEmitter)
function Line (file, content) {
  this.dirty = false
  this.file = file
  this.content = content
}

Line.prototype.dirty = function () { this.file.dirty() }

Object.getOwnPropertyNames(String.prototype).forEach(function (method) {
  Line.prototype[method] = function () {
    return this.content[method].apply(this.content, arguments)
  }
})

Line.prototype.inPlace = mutator(function (a, b, c) {
  this.content = this.content.replace(a, b, c)
  return this
})

Line.prototype.prepend = mutator(function (string) {
  this.content = [].slice.call(arguments).join('') + this.content
  return this
})

Line.prototype.append = mutator(function () {
  this.content += [].slice.call(arguments).join('');
  return this
})

Line.prototype.swap = mutator(function (newContent) {
  if (newContent[newContent.length - 1] === this.file.separator) {
    newContent = newContent.substr(0, newContent.length - 1)
  }
  this.content = newContent;
  return this
})

Line.prototype.valueOf = function () { return this.content }

Line.prototype.toJSON = function () { return this.content }

function mutator(f) {
  return function () {
    var result = f && f.apply(this, arguments)
    if (!this.dirty) {
      this.dirty = true
      process.nextTick(this.emit.bind(this, 'dirty'))
    }
    return result
  }
}
