'use strict';

function makeLogoRgba() {
  const width = 48;
  const height = 48;
  const data = new Uint8ClampedArray(width * height * 4);
  function set(x, y, r, g, b) {
    const i = (y * width + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) set(x, y, 255, 255, 255);
  }
  for (let y = 4; y < 22; y += 1) {
    for (let x = 4; x < 22; x += 1) set(x, y, 220, 30, 30);
  }
  for (let y = 4; y < 22; y += 1) {
    for (let x = 26; x < 44; x += 1) set(x, y, 30, 70, 210);
  }
  for (let y = 26; y < 44; y += 1) {
    for (let x = 4; x < 44; x += 1) set(x, y, 20, 160, 70);
  }
  [[23, 8], [23, 12], [23, 16], [10, 24], [20, 24], [30, 24], [40, 24]].forEach(([x, y]) => {
    set(x, y, 0, 0, 0);
  });
  for (let y = 46; y < 48; y += 1) {
    for (let x = 46; x < 48; x += 1) set(x, y, 240, 200, 20);
  }
  return { width, height, data };
}

module.exports = { makeLogoRgba };
