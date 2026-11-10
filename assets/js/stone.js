// 主页的西西弗斯石头：开场只有石头，坡跟着它画出来，推到坡顶后标题出现；之后一遍遍往上推，总差一点到顶。点一下把石头再推上坡顶一次；连点 5 次，它会翻过去。
(function () {
  var root = document.documentElement, hill = document.querySelector('.hill'); if (!hill) return;
  var path = hill.querySelector('path'), dot = hill.querySelector('circle'), push = hill.querySelector('.push');
  var L = path.getTotalLength(), R = 4, cur = 0, drawing = false, drawn = 0;
  function place(d) {
    cur = d;
    if (drawing) {               // 开场：坡跟着石头一点点画出来
      drawn = Math.max(drawn, d);
      path.style.strokeDasharray = L;
      path.style.strokeDashoffset = (L * (1 - drawn)).toFixed(2);
    }
    var p = path.getPointAtLength(L * d);
    dot.setAttribute('cx', p.x.toFixed(2)); dot.setAttribute('cy', (p.y - R).toFixed(2));
  }
  place(0);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('stone-intro'); push.hidden = true; return; }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  var TOP = .8, CYCLE = 12.4;
  function loop(s) {        // 歇 1.4 秒，推上去 6.6 秒，差一点到顶，停 1 秒，滚回来 3.4 秒
    s = s % CYCLE;
    if (s < 1.4) return 0;
    if (s < 8) return TOP * ease((s - 1.4) / 6.6);
    if (s < 9) return TOP;
    return TOP * (1 - ease((s - 9) / 3.4));
  }

  var mode, t0 = null, from = 0, up = 3.2, shown = false, opened = false;
  function intro(d) { mode = 'intro'; from = d; up = Math.max(1.4, 3.2 * (1 - d)); t0 = null; shown = false; }
  function introAt(s, now) {  // 等 0.6 秒，推到顶，标题出现，停 2.2 秒，滚回来 3.4 秒
    var a = .6, b = a + up, c = b + 2.2, e = c + 3.4;
    if (s < a) return from;
    if (s < b) return from + (1 - from) * ease((s - a) / (b - a));
    if (!shown) { shown = opened = true; root.classList.add('stone-done'); drawing = false; path.style.strokeDasharray = 'none'; path.style.strokeDashoffset = '0'; }
    if (s < c) return 1;
    if (s < e) return 1 - ease((s - c) / 3.4);
    mode = 'loop'; t0 = now;
    return 0;
  }

  if (root.classList.contains('stone-intro')) {
    drawing = true; intro(0);
    try { sessionStorage.setItem('bl-intro', '1'); } catch (e) {}
  } else {
    mode = 'loop'; t0 = null; shown = true; opened = true;
  }

  function tick(now) {
    if (t0 === null) t0 = mode === 'loop' ? now + 1000 : now;   // 没有开场时，先歇 2.4 秒
    var s = (now - t0) / 1000;
    if (mode === 'over') { var d = overAt(s, now); if (d !== null) place(d); }
    else place(s < 0 ? 0 : mode === 'intro' ? introAt(s, now) : loop(s));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // 彩蛋：几秒内连点 5 次，石头终于翻过坡顶，从另一边滚走，坡底再来一颗新的
  var taps = [], end = path.getPointAtLength(L), ox = 0;
  function over(d) { mode = 'over'; from = d; up = Math.max(.9, 1.6 * (1 - d)); t0 = null; taps = []; }
  function overAt(s, now) {   // 推到顶 → 翻过去、往下掉、淡出 → 停一下 → 坡底淡入一颗新的
    var a = up, b = a + 1.1, c = b + .9, e = c + .7, k;
    if (s < a) { dot.setAttribute('opacity', 1); return from + (1 - from) * ease(s / a); }
    if (s < b) {
      k = (s - a) / 1.1;
      dot.setAttribute('cx', (end.x + 46 * k).toFixed(2));
      dot.setAttribute('cy', (end.y - R - 5 * k + 60 * k * k).toFixed(2));
      dot.setAttribute('opacity', (1 - k * k).toFixed(3));
      return null;
    }
    if (s < c) { dot.setAttribute('opacity', 0); return 0; }
    if (s < e) { dot.setAttribute('opacity', ((s - c) / .7).toFixed(3)); return 0; }
    dot.setAttribute('opacity', 1); mode = 'loop'; t0 = now; return 0;
  }
  push.addEventListener('click', function () {
    if (mode === 'over') return;
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 4000; }); taps.push(now);
    if (taps.length >= 5 && opened) { over(cur); return; }
    if (mode === 'intro' && !shown) return;      // 正在往上推，别打断
    intro(cur);                                  // 只重推石头，标题和 slogan 不动
  });
})();
