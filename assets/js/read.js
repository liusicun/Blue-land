/* Blue Land reading page: contents, full-screen images, side notes, back to top */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(el) { if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }

  function setup(art) {
    if (!art || art.getAttribute('data-ready')) return;
    art.setAttribute('data-ready', '1');
    var prose = art.querySelector('.prose');
    if (!prose) return;

    // Chinese posts: add a small space between Chinese and Latin letters or numbers
    // where the browser can't do it by itself (text-autospace)
    var langEl = art.closest('[lang]'), lang = langEl ? langEl.getAttribute('lang') : '';
    if (/^zh/i.test(lang) && !(window.CSS && CSS.supports && CSS.supports('text-autospace', 'normal'))) {
      var cjk = '[\\u3400-\\u9fff\\uf900-\\ufaff]', lat = '[A-Za-z0-9]';
      var re1 = new RegExp('(' + cjk + ')(' + lat + ')', 'g'), re2 = new RegExp('(' + lat + ')(' + cjk + ')', 'g');
      [art.querySelector('.read-title'), prose].forEach(function (box) {
        if (!box) return;
        var w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null), t;
        while ((t = w.nextNode())) {
          if (t.parentNode.closest('code, pre')) continue;
          var v = t.nodeValue.replace(re1, '$1\u2005$2').replace(re2, '$1\u2005$2');
          if (v !== t.nodeValue) t.nodeValue = v;
        }
      });
    }

    // 1. Contents in the left margin, the blue dot follows the section you are reading
    var hs = [].slice.call(prose.querySelectorAll('h2'));
    var toc = null, links = [];
    if (hs.length >= 2) {
      toc = document.createElement('nav');
      toc.className = 'toc';
      toc.setAttribute('aria-label', 'Contents');
      var ol = document.createElement('ol');
      hs.forEach(function (h, i) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + (h.id || '');
        var n = document.createElement('span');
        n.className = 'toc-n'; n.textContent = (i < 9 ? '0' : '') + (i + 1);
        a.appendChild(n); a.appendChild(document.createTextNode(h.textContent));
        a.addEventListener('click', function (e) { e.preventDefault(); go(h); });
        li.appendChild(a); ol.appendChild(li); links.push(a);
      });
      var label = document.createElement('p');
      label.className = 'toc-label'; label.textContent = 'Contents';
      toc.appendChild(label); toc.appendChild(ol);
      art.appendChild(toc);
    }

    // 2. Click a picture to see it full screen, click again or press Esc to close
    prose.querySelectorAll('img').forEach(function (img) {
      img.classList.add('zoomable');
      img.addEventListener('click', function () {
        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', img.alt || 'Image');
        var big = new Image(); big.src = img.currentSrc || img.src; big.alt = img.alt;
        box.appendChild(big);
        var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        if (cap) { var c = document.createElement('p'); c.textContent = cap.textContent; box.appendChild(c); }
        document.body.appendChild(box);
        requestAnimationFrame(function () { box.classList.add('on'); });
        function close() {
          box.classList.remove('on');
          removeEventListener('keydown', key);
          setTimeout(function () { box.remove(); }, 260);
        }
        function key(e) { if (e.key === 'Escape') close(); }
        box.addEventListener('click', close);
        addEventListener('keydown', key);
      });
    });

    // 3. Footnotes become side notes in the right margin (tap the number on a phone)
    var notes = prose.querySelector('.footnotes');
    if (notes) {
      prose.querySelectorAll('sup[id^="fnref"]').forEach(function (sup) {
        var a = sup.querySelector('a'); if (!a) return;
        var li = notes.querySelector('[id="' + a.getAttribute('href').slice(1) + '"]'); if (!li) return;
        var copy = li.cloneNode(true);
        copy.querySelectorAll('.reversefootnote').forEach(function (r) { r.remove(); });
        var side = document.createElement('span');
        side.className = 'sidenote';
        var sn = document.createElement('span');
        sn.className = 'sn-n'; sn.textContent = a.textContent;
        side.appendChild(sn); side.appendChild(document.createTextNode(copy.textContent.trim()));
        sup.parentNode.insertBefore(side, sup.nextSibling);
        a.addEventListener('click', function (e) { e.preventDefault(); side.classList.toggle('open'); sup.classList.toggle('open'); });
      });
      prose.classList.add('has-side');
      notes.remove();
    }

    // End dot: keep it on the same line as the last word of the post
    var last = prose.lastElementChild;
    if (last && last.tagName === 'P') {
      var tn = last.lastChild;
      while (tn && tn.nodeType !== 3) tn = tn.lastChild;
      var m = tn && tn.nodeValue.match(/(\S+)\s*$/);
      if (m && tn.parentNode === last) {
        var end = document.createElement('span');
        end.className = 'end-dot';
        end.textContent = m[1];
        tn.nodeValue = tn.nodeValue.slice(0, m.index);
        last.appendChild(end);
        last.classList.add('glued');
      } else if (tn && tn.parentNode !== last && !tn.parentNode.closest('.sidenote, sup')) {
        // the post ends inside a link or bold text: put the dot right after it, unbreakable
        var el = tn.parentNode; while (el.parentNode !== last) el = el.parentNode;
        var wrap = document.createElement('span');
        wrap.className = 'end-dot';
        last.insertBefore(wrap, el); wrap.appendChild(el);
        last.classList.add('glued');
      }
    }

    // 4. Back to top: a small blue dot near the end of the post
    var top = document.createElement('button');
    top.type = 'button'; top.className = 'to-top'; top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<i></i>';
    top.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    art.appendChild(top);

    var tick = false;
    function draw() {
      tick = false;
      if (!art.offsetParent) return;
      var vh = innerHeight, max = document.documentElement.scrollHeight - vh;
      top.classList.toggle('on', max > 200 && scrollY > max * 0.72);
      if (!toc) return;
      var pr = prose.getBoundingClientRect();
      toc.classList.toggle('on', pr.top < vh * 0.55 && pr.bottom > vh * 0.45);
      var cur = 0;
      hs.forEach(function (h, i) { if (h.getBoundingClientRect().top < vh * 0.35) cur = i; });
      links.forEach(function (l, i) { l.toggleAttribute('aria-current', i === cur); });
    }
    function ask() { if (!tick) { tick = true; requestAnimationFrame(draw); } }
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    draw();
    art.blDraw = draw;
  }

  window.blRead = setup;
  document.querySelectorAll('article.read').forEach(setup);
})();
