inline-sourcemap-concat
-----------------------

Concatenate sources and inlined sourcemaps into a new generated sourcemap. Only inline sourcemaps are processed - external sourcemap references are discarded.

# methods

```js
var SourceMapConcat = require('inline-sourcemap-concat')
```

## var sm = SourceMapConcat.create(opts={})

Returns an instance of `SourceMapConcat.SourceMap`.

Optionally pass in:

* `opts.baseDir` - a string of the base directory from which to resolve the sourcemap sources.
* `opts.cache` - an object mapping sources to their encoder-differential state.
* `opts.mapCommentType` - defaults to `line`. will generate sourcemaps with `//#`, any other value will generate sourcemaps with `/*# */`.
* `opts.mapCommentCharset` - defaults to `utf-8`.
* `opts.sourceRoot` - a string of the sourcemap `sourceRoot`.
* `opts.file` - a string of the sourcemap `file`.

Available methods:

* `sm.addFileSource(filename, source)` - append a file and its inlined sourcemap if available. returns `source` with the sourcemap comment removed.
* `sm.addSpace(source)` - append files that don't have their own source mapping, but need to push the line/column count.
* `sm.comment()` - return the sourcemap comment.
* `sm.generate()` - return the sources and the sourcemap comment.

## SourceMapConcat.srcURL

A reference to lydell's [source-map-url](https://github.com/lydell/source-map-url).

Credits
-------

This library is mostly based on the work of ef4's [fast-sourcemap-concat](https://github.com/ef4/fast-sourcemap-concat).

The base64-vlq library is from mozilla's [source-map](https://github.com/mozilla/source-map/).
