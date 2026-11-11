// 主页的蓝色土地和西西弗斯的石头。
// 页面下面是一整块蓝色的土地，上沿是一道坡，石头就在蓝白交界上滚。
// 开场：先只有石头，土地跟着它从左往右长出来，推到坡顶后标题出现；
// 之后一遍遍往上推，总差一点到顶。点一下土地，把石头再推上坡顶一次；连点 5 次，它会翻过去。
// 翻过去以后：如果有藏起来的文章（头信息里写了 hidden: true），页面跟着石头去“山的另一边”。
(function () {
  var root = document.documentElement, land = document.querySelector('.land'); if (!land) return;
  var fill = land.querySelector('.land-fill'), shape = land.querySelector('.land-shape'), clip = land.querySelector('clipPath path'),
      lines = land.querySelector('.land-lines'), ridge = land.querySelector('.ridge'), dot = land.querySelector('circle'), push = land.querySelector('.push');
  var R = 6, L = 0, W = 0, mapW = 0, cur = 0, drawing = false;
  root.classList.add('land-on');

  // 土地的形状跟着屏幕宽度算：左低右高，中间一段最陡
  function lay() {
    var w = land.clientWidth, h = land.clientHeight; if (!w || !h) return;
    var yt = 2 * R + 6, rise = Math.min(h * .55, Math.max(64, w * .16)), yb = yt + rise;
    var c = 'M0 ' + yb.toFixed(1) + ' C ' + (w * .34).toFixed(1) + ' ' + yb.toFixed(1) + ' ' + (w * .61).toFixed(1) + ' ' + (yt + rise * .12).toFixed(1) + ' ' + w + ' ' + yt;
    var area = c + ' L ' + w + ' ' + h + ' L 0 ' + h + ' Z';
    ridge.setAttribute('d', c); shape.setAttribute('d', area); clip.setAttribute('d', area);
    L = ridge.getTotalLength(); W = w;
    if (window.blMap && Math.abs(w - mapW) > 40) {   // 土地里的等高线；只在宽度变了的时候重画
      mapW = w;
      lines.innerHTML = blMap.markup('Blue Land', w, h, 11, w > 900 ? 8 : 5);
    }
    place(cur);
  }
  function at(d) { return ridge.getPointAtLength(L * (.035 + .93 * d)); }
  function place(d) {
    cur = d;
    var p = at(d);
    if (drawing) {   // 开场：土地跟着石头长出来。边缘比石头领先一点点，石头到顶时土地正好长满整屏
      var rest = Math.max(0, W - at(1).x - R), edge = p.x + R + rest * Math.min(1, Math.max(0, d));
      fill.style.clipPath = fill.style.webkitClipPath = 'inset(0 ' + Math.max(0, W - edge).toFixed(1) + 'px 0 0)';
    }
    dot.setAttribute('cx', p.x.toFixed(2)); dot.setAttribute('cy', (p.y - R).toFixed(2));
  }
  function grown() { drawing = false; fill.style.clipPath = fill.style.webkitClipPath = ''; }
  lay();
  addEventListener('resize', lay);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('stone-intro'); push.hidden = true; place(.8); return; }
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
    if (!shown) { shown = opened = true; root.classList.add('stone-done'); grown(); }
    if (s < c) return 1;
    if (s < e) return 1 - ease((s - c) / 3.4);
    mode = 'loop'; t0 = now;
    return 0;
  }

  if (root.classList.contains('stone-intro')) {
    drawing = true; intro(0); place(0);
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
  var taps = [], overUrl = land.getAttribute('data-over'), gone = false;
  addEventListener('pageshow', function () { gone = false; });   // 从另一边按返回键回来，可以再翻一次
  function leave() {   // 跟着石头去山的另一边
    gone = true;
    try { sessionStorage.setItem('bl-go', '1'); } catch (err) {}
    root.classList.add('leave');
    setTimeout(function () { location.href = overUrl; }, 320);
  }
  function over(d) { mode = 'over'; from = d; up = Math.max(.9, 1.6 * (1 - d)); t0 = null; taps = []; }
  function overAt(s, now) {   // 推到顶 → 不停，顺着坡顶越滚越快，滚出屏幕右边 → 停一下 → 坡底淡入一颗新的
    var a = up, b = a + .75, c = b + .9, e = c + .7, k, end = at(1), lip = ridge.getPointAtLength(L);
    if (s < a) { dot.setAttribute('opacity', 1); return from + (1 - from) * ease(s / a); }
    if (s < b) {
      k = (s - a) / .75;
      var x = end.x + (W + R * 3 - end.x) * k * k;                       // 从静止开始加速
      var t = Math.min(1, (x - end.x) / Math.max(1, lip.x - end.x));     // 还在屏幕里的那一小段，贴着坡走
      dot.setAttribute('cx', x.toFixed(2));
      dot.setAttribute('cy', (end.y + (lip.y - end.y) * t - R).toFixed(2));
      if (overUrl && !gone && k > .55) leave();                           // 石头快出屏幕时，页面开始跟过去
      return null;
    }
    if (overUrl && !gone) leave();
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
