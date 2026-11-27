# Draws the app icons from the logo geometry in assets/logo.svg (serif "r" with an orange ball terminal).
# Run: python scripts/make-icons.py   (needs Pillow)
from PIL import Image, ImageDraw

INK, CREAM, ORANGE, WHITE = (28, 27, 24, 255), (253, 246, 230, 255), (238, 106, 31, 255), (255, 255, 255, 255)
CX, CY = 145.5, 145.5  # centre of the glyph in the 280-unit design grid
SS = 4  # supersampling


def glyph(size, scale, fg, ball):
    S = size * SS
    k = scale * SS
    ox, oy = S / 2 - CX * k, S / 2 - CY * k
    P = lambda x, y: (ox + x * k, oy + y * k)
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x, y, w, h in [(80, 94, 50, 11), (96, 94, 34, 122), (78, 204, 70, 12)]:
        d.rounded_rectangle([P(x, y), P(x + w, y + h)], radius=2 * k, fill=fg)
    p0, p1, p2, p3 = (113, 150), (113, 106), (142, 90), (176, 96)
    for i in range(301):
        t = i / 300
        a, b, c, e = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        x = a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0]
        y = a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]
        cx, cy = P(x, y)
        d.ellipse([cx - 15 * k, cy - 15 * k, cx + 15 * k, cy + 15 * k], fill=fg)
    bx, by = P(190, 98)
    d.ellipse([bx - 23 * k, by - 23 * k, bx + 23 * k, by + 23 * k], fill=ball)
    return img


def save(name, size, scale, fg, ball, bg=None, radius=0):
    img = glyph(size, scale, fg, ball)
    if bg:
        base = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(base).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius * SS, fill=bg)
        base.alpha_composite(img)
        img = base
    img.resize((size, size), Image.LANCZOS).save('assets/' + name)


save('icon.png', 1024, 2.8, CREAM, ORANGE, bg=INK)                # full-bleed: the stores round the corners themselves
save('android-icon-foreground.png', 1024, 2.8, CREAM, ORANGE)     # transparent; adaptive icon safe zone is the middle 66%
Image.new('RGBA', (512, 512), INK).save('assets/android-icon-background.png')
save('android-icon-monochrome.png', 432, 1.4, WHITE, WHITE)       # one colour, themed icons
save('favicon.png', 48, 0.24, CREAM, ORANGE, bg=INK, radius=11)
save('splash-icon.png', 1024, 4.0, CREAM, ORANGE)                 # shown on the ink splash background (app.json)
