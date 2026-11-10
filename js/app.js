/*
  页面逻辑：本地读取 PNG/JPG，在浏览器里调用 imagetracerjs 生成 SVG。
  不使用 fetch、XHR 或任何上传接口。
*/
(function () {
  'use strict';

  var limits = TraceOptions.LIMITS;
  var fileInput = document.getElementById('file');
  var drop = document.getElementById('drop');
  var colorInput = document.getElementById('color-count');
  var detailInput = document.getElementById('detail');
  var colorValue = document.getElementById('color-count-value');
  var detailValue = document.getElementById('detail-value');
  var downloadBtn = document.getElementById('download');
  var statusEl = document.getElementById('status');
  var noteEl = document.getElementById('scale-note');
  var originalImg = document.getElementById('original');
  var svgImg = document.getElementById('svg-preview');
  var originalEmpty = document.getElementById('original-empty');
  var svgEmpty = document.getElementById('svg-empty');

  colorInput.min = String(limits.colorCount.min);
  colorInput.max = String(limits.colorCount.max);
  colorInput.value = String(limits.colorCount.default);
  detailInput.min = String(limits.detail.min);
  detailInput.max = String(limits.detail.max);
  detailInput.value = String(limits.detail.default);

  var currentFile = null;
  var imageData = null;
  var svgText = '';
  var sourceUrl = null;
  var svgUrl = null;
  var traceToken = 0;
  var debounceTimer = 0;
  var dragDepth = 0;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function syncLabels() {
    colorValue.textContent = colorInput.value;
    detailValue.textContent = detailInput.value;
  }

  function clearSvgPreview() {
    svgText = '';
    downloadBtn.disabled = true;
    if (svgUrl) {
      URL.revokeObjectURL(svgUrl);
      svgUrl = null;
    }
    svgImg.removeAttribute('src');
    svgImg.hidden = true;
    svgEmpty.hidden = false;
  }

  function readFile(file) {
    if (!TraceOptions.isSupportedRasterFile(file)) {
      setStatus('请选择 PNG 或 JPG。');
      return;
    }
    currentFile = file;
    imageData = null;
    clearSvgPreview();
    noteEl.hidden = true;
    setStatus('正在读取图片…');
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(file);

    var img = new Image();
    img.onload = function () {
      var fitted = TraceOptions.fitSize(img.naturalWidth, img.naturalHeight, limits.maxEdge);
      var canvas = document.createElement('canvas');
      canvas.width = fitted.width;
      canvas.height = fitted.height;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, fitted.width, fitted.height);
      imageData = ctx.getImageData(0, 0, fitted.width, fitted.height);
      originalImg.src = sourceUrl;
      originalImg.hidden = false;
      originalEmpty.hidden = true;
      if (fitted.scale < 1) {
        noteEl.textContent = '原图较长的一边超过 ' + limits.maxEdge + ' 像素，转换前已在本机缩小。';
        noteEl.hidden = false;
      }
      scheduleTrace(0);
    };
    img.onerror = function () {
      setStatus('这张图片无法读取。');
    };
    img.src = sourceUrl;
  }

  function scheduleTrace(delay) {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runTrace, delay);
  }

  function runTrace() {
    if (!imageData) return;
    if (typeof ImageTracer === 'undefined' || !ImageTracer.imagedataToSVG) {
      setStatus('转换组件没有加载。');
      return;
    }
    var token = ++traceToken;
    var options = TraceOptions.toTracerOptions({
      colorCount: colorInput.value,
      detail: detailInput.value
    });
    var pixels = imageData;
    setStatus('正在转换…');
    downloadBtn.disabled = true;
    window.setTimeout(function () {
      if (token !== traceToken) return;
      var svg;
      try {
        svg = TraceOptions.asSvgDocument(ImageTracer.imagedataToSVG(pixels, options));
      } catch (err) {
        if (token !== traceToken) return;
        setStatus('转换失败。');
        return;
      }
      if (token !== traceToken) return;
      svgText = svg;
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      svgImg.src = svgUrl;
      svgImg.hidden = false;
      svgEmpty.hidden = true;
      downloadBtn.disabled = false;
      setStatus('已生成 SVG，可以下载。');
    }, 16);
  }

  downloadBtn.addEventListener('click', function () {
    if (!svgText) return;
    var url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = TraceOptions.svgFilename(currentFile && currentFile.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  });

  function openPicker() {
    fileInput.click();
  }

  drop.addEventListener('click', openPicker);

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (file) readFile(file);
  });

  drop.addEventListener('dragenter', function (event) {
    event.preventDefault();
    dragDepth += 1;
    drop.classList.add('is-over');
  });
  drop.addEventListener('dragover', function (event) {
    event.preventDefault();
  });
  drop.addEventListener('dragleave', function (event) {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) drop.classList.remove('is-over');
  });
  drop.addEventListener('drop', function (event) {
    event.preventDefault();
    dragDepth = 0;
    drop.classList.remove('is-over');
    var files = event.dataTransfer && event.dataTransfer.files;
    if (!files || !files.length) return;
    var chosen = null;
    for (var i = 0; i < files.length; i += 1) {
      if (TraceOptions.isSupportedRasterFile(files[i])) {
        chosen = files[i];
        break;
      }
    }
    if (!chosen) {
      setStatus('请选择 PNG 或 JPG。');
      return;
    }
    readFile(chosen);
  });

  document.addEventListener('dragover', function (event) {
    event.preventDefault();
  });
  document.addEventListener('drop', function (event) {
    event.preventDefault();
  });

  colorInput.addEventListener('input', function () {
    syncLabels();
    if (imageData) scheduleTrace(200);
  });
  detailInput.addEventListener('input', function () {
    syncLabels();
    if (imageData) scheduleTrace(200);
  });

  syncLabels();
  setStatus('选择一张 PNG 或 JPG。');
})();
