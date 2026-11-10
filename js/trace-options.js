/*
  纯函数：把页面上的颜色数 / 细节滑杆映射到 imagetracerjs 参数。
  浏览器通过 <script> 使用，测试通过 module.exports 使用。不发网络请求。
*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TraceOptions = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var LIMITS = {
    colorCount: { min: 2, max: 32, default: 8 },
    detail: { min: 0, max: 100, default: 50 },
    pathomitMax: 24,
    maxEdge: 800
  };

  function clampInt(value, min, max) {
    var n = Math.round(Number(value));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function toTracerOptions(input) {
    var source = input || {};
    var colorCount = clampInt(
      source.colorCount === undefined ? LIMITS.colorCount.default : source.colorCount,
      LIMITS.colorCount.min,
      LIMITS.colorCount.max
    );
    var detail = clampInt(
      source.detail === undefined ? LIMITS.detail.default : source.detail,
      LIMITS.detail.min,
      LIMITS.detail.max
    );
    var pathomit = Math.round(
      ((LIMITS.detail.max - detail) * LIMITS.pathomitMax) / LIMITS.detail.max
    );

    return {
      numberofcolors: colorCount,
      pathomit: pathomit,
      colorsampling: 2,
      mincolorratio: 0,
      colorquantcycles: 3,
      layering: 0,
      ltres: 1,
      qtres: 1,
      rightangleenhance: true,
      blurradius: 0,
      blurdelta: 20,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      viewbox: false,
      desc: false,
      strokewidth: 1
    };
  }

  function fitSize(width, height, maxEdge) {
    var edgeLimit = maxEdge || LIMITS.maxEdge;
    var w = Math.max(1, Math.round(Number(width) || 0));
    var h = Math.max(1, Math.round(Number(height) || 0));
    var longest = Math.max(w, h);
    if (longest <= edgeLimit) {
      return { width: w, height: h, scale: 1 };
    }
    var scale = edgeLimit / longest;
    return {
      width: Math.max(1, Math.round(w * scale)),
      height: Math.max(1, Math.round(h * scale)),
      scale: scale
    };
  }

  function isSupportedRasterFile(file) {
    if (!file) return false;
    var type = String(file.type || '').toLowerCase();
    if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') return true;
    var name = String(file.name || '').toLowerCase();
    return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
  }

  function svgFilename(originalName) {
    var base = String(originalName || '').replace(/\\/g, '/').split('/').pop().trim();
    var withoutExt = base.replace(/\.[^.]+$/, '');
    var cleaned = withoutExt
      .replace(/[^\w\u4e00-\u9fff.-]+/g, '_')
      .replace(/^[_ .-]+|[_ .-]+$/g, '')
      .slice(0, 80);
    return (cleaned || 'image') + '.svg';
  }

  function asSvgDocument(svg) {
    var text = String(svg || '').trim();
    if (text.indexOf('<svg') !== 0 && text.indexOf('<?xml') !== 0) {
      throw new Error('不是 SVG');
    }
    if (text.indexOf('<?xml') === 0) return text;
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + text;
  }

  return {
    LIMITS: LIMITS,
    clampInt: clampInt,
    toTracerOptions: toTracerOptions,
    fitSize: fitSize,
    isSupportedRasterFile: isSupportedRasterFile,
    svgFilename: svgFilename,
    asSvgDocument: asSvgDocument
  };
});
