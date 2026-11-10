#!/usr/bin/env python3
"""Make the share card images for Blue Land.

Run from the blog folder:  python3 _tools/share-cards.py
It writes assets/og/default.png for the site and assets/og/<post>.png for each
post, and adds `image: /assets/og/<post>.png` to any post that doesn't have one.
Needs Pillow and fontTools (pip install pillow fonttools brotli).
"""
import io, os, re, glob, datetime
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, PAD = 1200, 630, 80
PAPER, INK, SOFT, BLUE = (250, 250, 251), (20, 22, 29), (75, 79, 92), (28, 51, 201)
CJK_FONTS = ['/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/System/Library/Fonts/PingFang.ttc',
             '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 'C:/Windows/Fonts/msyhbd.ttc']

def woff2(name):
    f = TTFont(os.path.join(ROOT, 'assets/fonts', name)); f.flavor = None
    b = io.BytesIO(); f.save(b); return b.getvalue()

SYNE, MONO = woff2('syne-latin-700-normal.woff2'), woff2('ibm-plex-mono-latin-400-normal.woff2')
CJK = next((p for p in CJK_FONTS if os.path.exists(p)), None)

def fonts(data, size):
    lat = ImageFont.truetype(io.BytesIO(data), size)
    cjk = ImageFont.truetype(CJK, size) if CJK else lat
    return lat, cjk

def is_cjk(ch): return '\u2e80' <= ch <= '\u9fff' or '\uf900' <= ch <= '\uffef' or '\u3000' <= ch <= '\u303f'

def width(text, fs, track=0):
    return sum((fs[1] if is_cjk(c) else fs[0]).getlength(c) + track for c in text) - (track if text else 0)

def draw_text(d, xy, text, fs, fill, track=0):
    x, y = xy
    for c in text:
        f = fs[1] if is_cjk(c) else fs[0]
        sw = max(1, f.size // 42) if (is_cjk(c) and f.size > 30) else 0  # 中文字体偏细，描一点边
        d.text((x, y), c, font=f, fill=fill, anchor='ls', stroke_width=sw, stroke_fill=fill)
        x += f.getlength(c) + track
    return x

def wrap(text, fs, maxw):
    tokens = re.findall(r"[A-Za-z0-9'’\-.,:;!?&]+|\s+|.", text)
    lines, cur = [], ''
    for t in tokens:
        if cur and width((cur + t).rstrip(), fs) > maxw:
            lines.append(cur.rstrip()); cur = t.lstrip()
        else:
            cur += t
        while width(cur.rstrip(), fs) > maxw and len(cur.strip()) > 1:
            # a single word wider than the card: break it by character
            cut = len(cur)
            while cut > 1 and width(cur[:cut], fs) > maxw: cut -= 1
            lines.append(cur[:cut]); cur = cur[cut:]
    if cur.strip(): lines.append(cur.rstrip())
    return lines

def wordmark(d, x, y, size=24):
    fs = fonts(SYNE, size); tr = size * .42
    x = draw_text(d, (x, y), 'BLUE', fs, BLUE, tr) + tr
    x = draw_text(d, (x, y), 'LAND', fs, INK, tr)
    r = size * .16; d.ellipse([x + 4, y - size * .34 - r, x + 4 + 2 * r, y - size * .34 + r], fill=BLUE)

def post_card(title, meta, out):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    wordmark(d, PAD, PAD + 18)
    maxw = W - 2 * PAD - 40
    for size in range(84, 40, -4):
        fs = fonts(SYNE, size); lines = wrap(title, fs, maxw)
        if len(lines) <= 3: break
    lh = size * 1.14; y = 250 + size * .8
    for i, line in enumerate(lines):
        x = draw_text(d, (PAD, y), line, fs, INK)
        if i == len(lines) - 1:
            r = size * .1; d.ellipse([x + size * .1, y - r * 2, x + size * .1 + 2 * r, y], fill=BLUE)
        y += lh
    d.rectangle([PAD, H - 112, W - PAD, H - 111], fill=BLUE)
    draw_text(d, (PAD, H - 66), meta.upper(), fonts(MONO, 20), BLUE, 20 * .18)
    im.save(out, optimize=True)

def site_card(title, slogan, out):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    size = 76; fs = fonts(SYNE, size); tr = size * .5
    words = title.upper().split(' ', 1)
    total = width(title.upper(), fs, tr) + size * .32
    x = (W - total) / 2; y = H / 2 + 10
    x = draw_text(d, (x, y), words[0], fs, BLUE, tr) + tr
    if len(words) > 1: x = draw_text(d, (x, y), words[1], fs, INK, tr)
    r = size * .11; d.ellipse([x + 2, y - r * 2 - 2, x + 2 + 2 * r, y - 2], fill=BLUE)
    sf = fonts(MONO, 22); sw = width(slogan, sf, 22 * .16)
    draw_text(d, ((W - sw) / 2, y + 86), slogan, sf, SOFT, 22 * .16)
    im.save(out, optimize=True)

def front(path):
    s = open(path, encoding='utf-8').read()
    m = re.match(r'---\n(.*?)\n---\n', s, re.S)
    return s, (m.group(1) if m else '')

def field(fm, key):
    m = re.search(rf'^{key}:\s*(.+)$', fm, re.M)
    return m.group(1).strip().strip('"\'') if m else ''

def main():
    os.makedirs(os.path.join(ROOT, 'assets/og'), exist_ok=True)
    cfg = open(os.path.join(ROOT, '_config.yml'), encoding='utf-8').read()
    site_card(field(cfg, 'title') or 'Blue Land', field(cfg, 'slogan'), os.path.join(ROOT, 'assets/og/default.png'))
    for p in sorted(glob.glob(os.path.join(ROOT, '_posts', '*.md'))):
        s, fm = front(p); stem = os.path.splitext(os.path.basename(p))[0]
        date = datetime.date(*map(int, stem[:10].split('-')))
        tags = [t.strip().strip('"\'') for t in field(fm, 'tags').strip('[]').split(',') if t.strip()]
        meta = '  ·  '.join([date.strftime('%b %-d, %Y')] + tags)
        post_card(field(fm, 'title'), meta, os.path.join(ROOT, 'assets/og', stem + '.png'))
        if not re.search(r'^image:', fm, re.M):
            s = s.replace('\n---\n', f'\nimage: /assets/og/{stem}.png\n---\n', 1)
            open(p, 'w', encoding='utf-8').write(s)
        print('card', stem)

if __name__ == '__main__':
    main()
