/* global describe, it */
var assert = require('chai').assert;
var expect = require('chai').expect;
var SourceMapConcat = require('..');
var fs = require('fs');
var sinon = require('sinon');

describe('fast sourcemap concat', function() {

  it('should pass basic smoke test', function() {
    var s1 = SourceMapConcat.create();
    s1.addFileSource('fixtures/inner/first.js',
      inlineExternalMap('test/fixtures/inner/first.js'));
    s1.addSpace("'x';");
    s1.addFileSource('fixtures/inner/second.js',
      inlineExternalMap('test/fixtures/inner/second.js'));

    var s2 = SourceMapConcat.create();
    s2.addFileSource('fixtures/other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));

    var s = SourceMapConcat.create({file: 'final.js'});
    s.addFileSource('tmp/intermediate.js', s1.generate());
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addFileSource('tmp/intermediate2.js', s2.generate());

    expect( s.generate() ).equals( inlineExternalMap('test/expected/final.js') );
  });

  it("should accept inline sourcemaps", function() {
    var s = SourceMapConcat.create({file: 'from-inline.js'});
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addSpace("/* My First Separator */");
    s.addFileSource('fixtures/inline-mapped.js',
      inlineExternalMap('test/fixtures/inline-mapped.js'));
    s.addSpace("/* My Second */");
    s.addFileSource('fixtures/other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/from-inline.js') );
  });

  it("should allow adding file contents from string", function() {
    var s = SourceMapConcat.create({file: 'from-inline.js'});
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addSpace("/* My First Separator */");
    s.addFileSource('fixtures/inline-mapped.js',
      inlineExternalMap('test/fixtures/inline-mapped.js'));
    s.addSpace("/* My Second */");
    s.addFileSource('fixtures/other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/from-inline.js') );
  });

  it("should correctly concatenate a sourcemapped coffeescript example", function() {
    var s = SourceMapConcat.create({file:'coffee-example.js'});
    s.addFileSource('fixtures/coffee/aa-loader.js',
      inlineExternalMap('test/fixtures/coffee/aa-loader.js'));
    s.addFileSource('fixtures/coffee/rewriter.js',
      inlineExternalMap('test/fixtures/coffee/rewriter.js'));
    s.addSpace("/* My First Separator */");
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/coffee-example.js') );
  });

  it("should discover external sources", function() {
    var s = SourceMapConcat.create({file: 'external-content.js'});
    s.addFileSource('other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addSpace("/* My First Separator */");
    s.addFileSource('external-content/all-inner.js',
      inlineExternalMap('test/fixtures/external-content/all-inner.js'));
    s.addSpace("/* My Second */");
    s.addFileSource('other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/external-content.js') );
  });

  it("should populate cache", function() {
    var cache = {};
    var s = SourceMapConcat.create({file: 'external-content.js', baseDir: 'fixtures', cache: cache});
    s.addFileSource('other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addSpace("/* My First Separator */");
    s.addFileSource('external-content/all-inner.js',
      inlineExternalMap('test/fixtures/external-content/all-inner.js'));
    s.addSpace("/* My Second */");
    s.addFileSource('other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));
    expect( s.generate() ).equals( inlineExternalMap('test/expected/external-content.js') );

    assert.deepEqual(cache, {
      "2a257e37006faed088631037626f5117": { encoder: "AEAAA", lines: 11 }
    });
  });

  it("should use cache", function() {
    var cache = {};
    var s;

    function once(finalFile) {
      var s1 = SourceMapConcat.create();
      s1.addFileSource('fixtures/inner/first.js',
        inlineExternalMap('test/fixtures/inner/first.js'));
      s1.addSpace("'x';");
      s1.addFileSource('fixtures/inner/second.js',
        inlineExternalMap('test/fixtures/inner/second.js'));

      var s2 = SourceMapConcat.create();
      s2.addFileSource('fixtures/other/fourth.js',
        inlineExternalMap('test/fixtures/other/fourth.js'));

      s = SourceMapConcat.create({cache: cache, file: finalFile});
      sinon.spy(s, '_scanMappings');
      s.addFileSource('tmp/intermediate.js', s1.generate());
      s.addFileSource('fixtures/other/third.js',
        inlineExternalMap('test/fixtures/other/third.js'));
      s.addFileSource('tmp/intermediate2.js', s2.generate());
    }

    once('firstPass.js');
    once('final.js');

    expect( s.generate() ).equals( inlineExternalMap('test/expected/final.js') );
    expect(s._scanMappings.getCall(0).args[3], 'should receive cacheHint').to.be.ok();
    expect(s._scanMappings.getCall(1).args[3], 'should receive cacheHint').to.be.ok();
  });

  it.skip("supports mapFile & mapURL", function() {});

  it("outputs block comments when 'mapCommentType' is 'block'", function() {
    var s = SourceMapConcat.create({mapCommentType: 'block'});
    expect( s.generate() ).equals('/*# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwic291cmNlc0NvbnRlbnQiOltdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIn0= */');
  });

  it.skip("should warn but tolerate broken sourcemap URL", function() {});

  it("corrects upstream sourcemap that is too short", function() {
    var s = SourceMapConcat.create({file: 'test-short.js'});
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addFileSource('fixtures/short/rewriter.js',
      inlineExternalMap('test/fixtures/short/rewriter.js'));
    s.addFileSource('fixtures/other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/test-short.js') );
  });

  it("corrects upstream sourcemap that is too short, on cached second build", function() {
    var cache = {};
    var s;

    function once() {
      s = SourceMapConcat.create({cache: cache, file: 'test-short.js'});
      s.addFileSource('fixtures/other/third.js',
        inlineExternalMap('test/fixtures/other/third.js'));
      s.addFileSource('fixtures/short/rewriter.js',
        inlineExternalMap('test/fixtures/short/rewriter.js'));
      s.addFileSource('fixtures/other/fourth.js',
        inlineExternalMap('test/fixtures/other/fourth.js'));
    }

    once();
    once();

    expect( s.generate() ).equals( inlineExternalMap('test/expected/test-short.js') );
  });

  it("deals with missing newline followed by single newline", function() {
    var s = SourceMapConcat.create({file: 'iife-wrapping.js'});
    s.addFileSource('fixtures/other/fourth.js',
      inlineExternalMap('test/fixtures/other/fourth.js'));
    s.addSpace('\n');
    s.addFileSource('fixtures/iife-wrapping/iife-start',
      inlineExternalMap('test/fixtures/iife-wrapping/iife-start'));
    s.addSpace('\n');
    s.addFileSource('fixtures/other/third.js',
      inlineExternalMap('test/fixtures/other/third.js'));
    s.addSpace('\n');
    s.addFileSource('fixtures/iife-wrapping/iife-end',
      inlineExternalMap('test/fixtures/iife-wrapping/iife-end'));

    expect( s.generate() ).equals( inlineExternalMap('test/expected/iife-wrapping.js') );
  });

});

// on-the-fly external sourcemap inliner. allows using
// fast-sourcemap-concat's tests against inline-sourcemap-concat.
function inlineExternalMap(file) {
  var FastSourcemapConcat = require('fast-sourcemap-concat');
  FastSourcemapConcat.prototype._initializeStream = function() {
    this.source = '';
    this.stream = {write: function(add) { this.source += add; }.bind(this)};
  };
  var src = fs.readFileSync(file, 'utf8');
  if (SourceMapConcat.existsIn(src) && !SourceMapConcat.hasInline(src)) {
    var sm = new FastSourcemapConcat({outputFile: file});
    sm.mapCommentCharset = 'utf-8';
    sm.addFileSource(file, src);
    return sm.source + SourceMapConcat.SourceMap.prototype.comment.call(sm);
  }
  return src;
}
