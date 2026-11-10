'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { encodePng, decodePng } = require('./png');
const { makeLogoRgba } = require('./logo-pixels');
const TraceOptions = require('../js/trace-options');
const ImageTracer = require('../vendor/imagetracerjs/imagetracer');

const root = path.join(__dirname, '..');
const fixturePath = path.join(__dirname, 'fixtures', 'logo.png');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function sha256(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
}

function pixel(image, x, y) {
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
}

function fillsOf(svg) {
  return new Set([...svg.matchAll(/fill="rgb\(([^)]+)\)"/g)].map((match) => match[1]));
}

function pathCount(svg) {
  return (svg.match(/<path\b/g) || []).length;
}

function traceFixture(image, controls) {
  const options = TraceOptions.toTracerOptions(controls);
  const svg = ImageTracer.imagedataToSVG(
    { width: image.width, height: image.height, data: image.data },
    options
  );
  return { options, svg, document: TraceOptions.asSvgDocument(svg) };
}

test('png round-trip keeps pixels', () => {
  const logo = makeLogoRgba();
  const decoded = decodePng(encodePng(logo.width, logo.height, logo.data));
  assert.equal(decoded.width, 48);
  assert.equal(decoded.height, 48);
  assert.deepEqual(Buffer.from(decoded.data), Buffer.from(logo.data));
});

test('fixture logo.png is the committed raster used for tracing', () => {
  const decoded = decodePng(fs.readFileSync(fixturePath));
  const expected = makeLogoRgba();
  assert.deepEqual(Buffer.from(decoded.data), Buffer.from(expected.data));
  assert.deepEqual(pixel(decoded, 10, 10), [220, 30, 30, 255]);
  assert.deepEqual(pixel(decoded, 30, 10), [30, 70, 210, 255]);
  assert.deepEqual(pixel(decoded, 10, 30), [20, 160, 70, 255]);
  assert.deepEqual(pixel(decoded, 0, 0), [255, 255, 255, 255]);
  assert.deepEqual(pixel(decoded, 23, 8), [0, 0, 0, 255]);
  assert.deepEqual(pixel(decoded, 46, 46), [240, 200, 20, 255]);
});

test('slider values map to numberofcolors and pathomit', () => {
  const coarse = TraceOptions.toTracerOptions({ colorCount: 2, detail: 0 });
  const fine = TraceOptions.toTracerOptions({ colorCount: 32, detail: 100 });
  const mid = TraceOptions.toTracerOptions({ colorCount: 8, detail: 50 });
  assert.equal(coarse.numberofcolors, 2);
  assert.equal(coarse.pathomit, 24);
  assert.equal(fine.numberofcolors, 32);
  assert.equal(fine.pathomit, 0);
  assert.equal(mid.numberofcolors, 8);
  assert.equal(mid.pathomit, 12);
  assert.equal(mid.colorsampling, 2);
  assert.equal(TraceOptions.toTracerOptions({ colorCount: 1, detail: -5 }).numberofcolors, 2);
  assert.equal(TraceOptions.toTracerOptions({ colorCount: 99, detail: 1000 }).numberofcolors, 32);
  assert.equal(TraceOptions.toTracerOptions({ colorCount: 99, detail: 1000 }).pathomit, 0);
  const first = TraceOptions.toTracerOptions({ colorCount: 8, detail: 50 });
  first.numberofcolors = 2;
  assert.equal(TraceOptions.toTracerOptions({ colorCount: 8, detail: 50 }).numberofcolors, 8);
});

test('fitSize, file types, and download names', () => {
  assert.deepEqual(TraceOptions.fitSize(400, 200), { width: 400, height: 200, scale: 1 });
  assert.deepEqual(TraceOptions.fitSize(1600, 800), { width: 800, height: 400, scale: 0.5 });
  assert.equal(TraceOptions.fitSize(800, 1600).width, 400);
  assert.equal(TraceOptions.LIMITS.maxEdge, 800);

  assert.equal(TraceOptions.isSupportedRasterFile({ type: 'image/png', name: 'a.png' }), true);
  assert.equal(TraceOptions.isSupportedRasterFile({ type: 'image/jpeg', name: 'a.jpg' }), true);
  assert.equal(TraceOptions.isSupportedRasterFile({ type: '', name: 'photo.JPEG' }), true);
  assert.equal(TraceOptions.isSupportedRasterFile({ type: 'image/gif', name: 'a.gif' }), false);
  assert.equal(TraceOptions.isSupportedRasterFile({ type: 'image/webp', name: 'a.webp' }), false);
  assert.equal(TraceOptions.isSupportedRasterFile({ type: 'image/svg+xml', name: 'a.svg' }), false);
  assert.equal(TraceOptions.isSupportedRasterFile(null), false);

  assert.equal(TraceOptions.svgFilename('Logo.PNG'), 'Logo.svg');
  assert.equal(TraceOptions.svgFilename('我的图标.jpg'), '我的图标.svg');
  assert.equal(TraceOptions.svgFilename('my logo.png'), 'my_logo.svg');
  assert.equal(TraceOptions.svgFilename('../secret.png'), 'secret.svg');
  assert.equal(TraceOptions.svgFilename('.png'), 'image.svg');
});

test('fixture PNG traces to an SVG, and color/detail controls change it', () => {
  const image = decodePng(fs.readFileSync(fixturePath));
  const fewColors = traceFixture(image, { colorCount: 2, detail: 100 });
  const manyColors = traceFixture(image, { colorCount: 16, detail: 100 });
  const lowDetail = traceFixture(image, { colorCount: 16, detail: 0 });
  const again = traceFixture(image, { colorCount: 16, detail: 100 });

  for (const result of [fewColors, manyColors, lowDetail]) {
    assert.match(result.svg, /^<svg\b/);
    assert.match(result.svg, /<\/svg>$/);
    assert.match(result.svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(result.document, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<svg\b/);
    assert.ok(pathCount(result.svg) > 0);
  }

  assert.notEqual(fewColors.svg, manyColors.svg);
  assert.ok(fillsOf(manyColors.svg).size >= fillsOf(fewColors.svg).size + 2);
  assert.notEqual(lowDetail.svg, manyColors.svg);
  assert.ok(pathCount(manyColors.svg) > pathCount(lowDetail.svg));
  assert.equal(again.svg, manyColors.svg);
  assert.equal(fewColors.options.numberofcolors, 2);
  assert.equal(manyColors.options.pathomit, 0);
  assert.equal(lowDetail.options.pathomit, TraceOptions.LIMITS.pathomitMax);
});

test('page, library, and docs stay local and match the locked cut', () => {
  const pageFiles = ['index.html', 'js/app.js', 'js/trace-options.js', 'styles.css'];
  const banned = [
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /sendBeacon/,
    /potrace/i,
    /creem/i,
    /dodo/i,
    /\bstripe\b/i,
    /paypal/i,
    /https?:\/\//
  ];
  for (const rel of pageFiles) {
    const source = read(rel);
    for (const pattern of banned) {
      assert.equal(pattern.test(source), false, `${rel} matched ${pattern}`);
    }
  }

  const app = read('js/app.js');
  const html = read('index.html');
  assert.match(app, /imagedataToSVG/);
  assert.doesNotMatch(app, /imageToSVG|loadImage/);
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /id="color-count"/);
  assert.match(html, /id="detail"/);
  assert.match(html, /min="2"/);
  assert.match(html, /max="32"/);
  assert.match(html, /id="download"/);
  assert.match(html, /vendor\/imagetracerjs\/imagetracer\.js/);
  assert.doesNotMatch(html, /type="module"/);

  assert.equal(
    sha256('vendor/imagetracerjs/imagetracer.js'),
    '1f7e21062196c53f2565120fc0708eac197c8403ec1bea28b381056ea0c3fdb9'
  );
  assert.equal(
    sha256('vendor/imagetracerjs/LICENSE'),
    '60d2c28d19d2bdf7bbaa59829e7a595234265e8111a01ccb74d25d6c4d2d013a'
  );
  const license = read('vendor/imagetracerjs/LICENSE');
  const library = read('vendor/imagetracerjs/imagetracer.js');
  assert.match(license, /public domain/i);
  assert.match(library, /imagetracer\.js version 1\.2\.6/);
  assert.match(library, /The Unlicense \/ PUBLIC DOMAIN/);
  assert.doesNotMatch(library, /potrace|GPL/i);

  for (const rel of ['README.md', 'FEATURE_MAP.md']) {
    const doc = read(rel);
    assert.match(doc, /IMAGE-VECTORIZE-CUT-2026-11-10-v1/);
    assert.match(doc, /imagetracerjs/);
    assert.match(doc, /Unlicense/);
    assert.match(doc, /numberofcolors/);
    assert.match(doc, /pathomit/);
    assert.match(doc, /Shane/);
    assert.match(doc, /Pages/);
    assert.match(doc, /背景/);
  }

  const gitignore = read('.gitignore').split('\n');
  for (const line of ['node_modules/', '.env', '.env.*', '.env.local', '.claude/settings.local.json']) {
    assert.ok(gitignore.includes(line), line);
  }
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test test/vectorize.test.js');
  assert.equal(pkg.dependencies, undefined);
});
