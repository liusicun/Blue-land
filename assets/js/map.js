/* Blue Land 的地形图：用一句话（文章标题）当种子，画出一幅等高线。
   同一个标题永远是同一张图，换个标题就是另一片地。不用配图，也不用手动生成。
   用法：<svg class="map" data-seed="文章标题"></svg>，这个文件会自动把它画出来。 */
(function () {
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // 返回每一层等高线的 path 字符串（从低到高）
  function paths(seed, w, h, levels, step) {
    levels = levels || 9; step = step || 4;
    var r = rng(hash(String(seed))), s = Math.max(w, h), bumps = [], i, j, k;
    for (i = 0; i < 7; i++) {
      bumps.push({ x: (r() * 1.2 - .1) * w, y: (r() * 1.2 - .1) * h, r: (.18 + r() * .24) * s, a: (.5 + r() * .7) * (r() < .3 ? -.6 : 1) });
    }
    var fx = 3 + r() * 3, fy = 3 + r() * 3, ph = r() * 6;
    var nx = Math.ceil(w / step) + 1, ny = Math.ceil(h / step) + 1, z = new Float32Array(nx * ny), lo = 1e9, hi = -1e9;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var x = i * step, y = j * step, v = .18 * Math.sin(x / s * fx + ph) * Math.cos(y / s * fy);
      for (k = 0; k < 7; k++) { var b = bumps[k], dx = x - b.x, dy = y - b.y; v += b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.r * b.r)); }
      z[j * nx + i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    function f(n) { return n.toFixed(1); }
    var out = [];
    for (var l = 1; l <= levels; l++) {
      var t = lo + (hi - lo) * l / (levels + 1), d = '';
      for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
        var a = z[j * nx + i], bb = z[j * nx + i + 1], c = z[(j + 1) * nx + i + 1], e = z[(j + 1) * nx + i];
        var m = (a > t ? 8 : 0) | (bb > t ? 4 : 0) | (c > t ? 2 : 0) | (e > t ? 1 : 0);
        if (m === 0 || m === 15) continue;
        var x0 = i * step, y0 = j * step;
        var T = f(x0 + step * (t - a) / (bb - a)) + ' ' + f(y0);
        var Rt = f(x0 + step) + ' ' + f(y0 + step * (t - bb) / (c - bb));
        var B = f(x0 + step * (t - e) / (c - e)) + ' ' + f(y0 + step);
        var Lf = f(x0) + ' ' + f(y0 + step * (t - a) / (e - a));
        switch (m) {
          case 1: case 14: d += 'M' + Lf + 'L' + B; break;
          case 2: case 13: d += 'M' + B + 'L' + Rt; break;
          case 3: case 12: d += 'M' + Lf + 'L' + Rt; break;
          case 4: case 11: d += 'M' + T + 'L' + Rt; break;
          case 6: case 9: d += 'M' + T + 'L' + B; break;
          case 7: case 8: d += 'M' + T + 'L' + Lf; break;
          case 5: d += 'M' + T + 'L' + Lf + 'M' + B + 'L' + Rt; break;
          case 10: d += 'M' + T + 'L' + Rt + 'M' + Lf + 'L' + B; break;
        }
      }
      out.push(d);
    }
    return out;
  }
  // 每隔两层加粗一层，像真的地形图
  function markup(seed, w, h, levels, step) {
    return paths(seed, w, h, levels, step).map(function (d, i) {
      return d ? '<path' + (i % 3 === 0 ? ' class="b"' : '') + ' d="' + d + '"/>' : '';
    }).join('');
  }
  function draw(svg) {
    if (svg.getAttribute('data-drawn')) return;
    var box = svg.closest('.plate, .map-box') || svg;
    box.classList.add('drawn');
    var rc = svg.getBoundingClientRect(), w = Math.round(rc.width), h = Math.round(rc.height);
    if (w < 20 || h < 20) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.innerHTML = markup(svg.getAttribute('data-seed') || '', w, h, +svg.getAttribute('data-levels') || 9, w > 700 ? 5 : w < 90 ? 2 : 4);
    svg.setAttribute('data-drawn', '1');
  }
  window.blMap = { paths: paths, markup: markup, draw: draw };
  [].forEach.call(document.querySelectorAll('svg.map[data-seed]'), draw);
})();
