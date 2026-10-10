#!/usr/bin/env python3
"""تولید آیکون‌های PNG برای برنامه نظام — بدون هیچ وابستگی خارجی.
اجرا:  python3 tools/make-icons.py
خروجی: icons/icon-192.png، icons/icon-512.png، icons/maskable-512.png
"""
import math
import os
import struct
import zlib

ACCENT = (47, 125, 107)   # #2f7d6b
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)
SS = 3                    # نمونه‌برداری فوق‌سری برای نرم‌کردن لبه‌ها


def dist_point_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    seg = dx * dx + dy * dy
    if seg == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / seg
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def inside_rounded_rect(x, y, w, h, r):
    (x0, y0, x1, y1) = (0.0, 0.0, float(w), float(h))
    if x < x0 + r:
        cx = x0 + r
    elif x > x1 - r:
        cx = x1 - r
    else:
        cx = x
    if y < y0 + r:
        cy = y0 + r
    elif y > y1 - r:
        cy = y1 - r
    else:
        cy = y
    if (x0 + r <= x <= x1 - r) or (y0 + r <= y <= y1 - r):
        return x0 <= x <= x1 and y0 <= y <= y1
    return math.hypot(x - cx, y - cy) <= r


def make_icon(size, maskable):
    n = size
    buf = bytearray(n * n * 4)
    # مختصات طراحی بر پایه مربع ۱ واحد
    cx, cy = 0.5, 0.54
    ring_r = 0.30
    ring_t = 0.055
    check_t = 0.075
    check = [(0.355, 0.55), (0.455, 0.665), (0.66, 0.415)]
    corner = 0.0 if maskable else 0.22

    for py in range(n):
        for px in range(n):
            # میانگین پوشش روی چند نمونه
            cov_bg = 0.0
            cov_mark = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) / n
                    y = (py + (sy + 0.5) / SS) / n
                    # پس‌زمینه
                    if maskable:
                        bg = True
                    else:
                        bg = inside_rounded_rect(x * n, y * n, n, n, corner * n)
                    if bg:
                        cov_bg += 1.0
                    # حلقه
                    d = math.hypot(x - cx, y - cy)
                    if ring_r - ring_t / 2 <= d <= ring_r + ring_t / 2:
                        cov_mark += 1.0
                        continue
                    # تیک
                    hit = False
                    for i in range(len(check) - 1):
                        dd = dist_point_seg(x, y, check[i][0], check[i][1], check[i + 1][0], check[i + 1][1])
                        if dd <= check_t / 2:
                            hit = True
                            break
                    if hit:
                        cov_mark += 1.0
            total = SS * SS
            bg_a = cov_bg / total
            mk = cov_mark / total
            r = g = b = 0.0
            a = 0.0
            if bg_a > 0:
                r, g, b = ACCENT
                a = 255.0 * bg_a
            if mk > 0:
                # رنگ علامت سفید، روی پس‌زمینه ترکیب می‌شود
                mix = mk
                r = r * (1 - mix) + WHITE[0] * mix
                g = g * (1 - mix) + WHITE[1] * mix
                b = b * (1 - mix) + WHITE[2] * mix
                a = max(a, 255.0 * mk)
            idx = (py * n + px) * 4
            buf[idx] = int(round(r))
            buf[idx + 1] = int(round(g))
            buf[idx + 2] = int(round(b))
            buf[idx + 3] = int(round(min(255.0, a)))
    return bytes(buf)


def write_png(path, w, h, rgba):
    raw = b''.join(b'\x00' + bytes(rgba[y * w * 4:(y + 1) * w * 4]) for y in range(h))

    def chunk(typ, data):
        return (struct.pack('>I', len(data)) + typ + data +
                struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF))

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, '..', 'icons')
    os.makedirs(out, exist_ok=True)
    jobs = [
        ('icon-192.png', 192, False),
        ('icon-512.png', 512, False),
        ('maskable-512.png', 512, True),
    ]
    for name, size, maskable in jobs:
        data = make_icon(size, maskable)
        path = os.path.join(out, name)
        write_png(path, size, size, data)
        print('نوشته شد:', path)


if __name__ == '__main__':
    main()
