# tie-file

A port(ish) of [Tie::File](http://search.cpan.org/perldoc?Tie::File), this creates an array-like object with the contents of
a file on disk, where all modifications are written to the file automatically.

## Usage

```javascript
var tieFile = require('tie-file')

// File will be created on first modification if it doesn't exist
var file = tieFile(filename)

file.set(13, 'blah');      // line 13 of the file is now 'blah'
console.log(file.get(42)); // display line 42 of the file

nRecs = file.length;       // how many records are in the file?
file.splice(nRecs - 3, 2); // chop two records off the end


// Replace javascript with JavaScript everywhere in the file
file.forEach(function (line) {
  line.inPlace(/javascript/i, 'JavaScript')
})

// These are just like regular push, pop, unshift, shift, and splice
// Except that they modify the file in the way you would expect

file.push(recs...);
var r1 = file.pop();
file.unshift(recs...);
var r2 = file.shift();
var oldRecs = file.splice(3, 7, recs...);

// file is an EventEmitter
file.on('error', function (err) { ... })
```

## Status

Very incomplete, untested, something of a PoC at this point.

## In-place modification of lines

Line objects act like strings but add a few extra methods that allow them to be modified in-place:

### swap(string)

Replace the line with `string`.

### inPlace(pattern, replacement)

Just like String.prototype.replace, but will `swap` the line with the return value.

### {prepend, append}(string...)

Places one or more strings at the start/end of the line.

# Caveats

Array access doesn't work (yet?), for now you must use the `get`/`set` methods. I'm not sure how best to do this without resorting to ES6 proxies.

# License

BSD
