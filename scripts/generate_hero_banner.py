"""
ClawForge Hero Banner Generator
Generates a 1920x640 cinematic banner: claw -> forge -> code -> video play button
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

W, H = 1920, 640
random.seed(42)

# Color palette
NAVY = (12, 14, 32)
VIOLET = (28, 18, 54)
WARM_DARK = (40, 22, 28)
DEEP_BG = (8, 9, 22)
AMBER = (255, 165, 50)
AMBER_BRIGHT = (255, 210, 120)
AMBER_DEEP = (220, 95, 25)
EMBER = (255, 130, 40)
STEEL_LIGHT = (180, 195, 215)
STEEL = (110, 125, 150)
STEEL_DARK = (55, 65, 85)
CODE_CYAN = (140, 220, 255)
CODE_VIOLET = (190, 150, 255)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


# ---------------- Background gradient ----------------
def make_background():
    img = Image.new("RGB", (W, H), DEEP_BG)
    px = img.load()
    for x in range(W):
        # horizontal: navy/violet -> warm dark
        tx = x / (W - 1)
        # ease curve
        tx_e = tx * tx * (3 - 2 * tx)
        for y in range(H):
            ty = y / (H - 1)
            # vertical vignette darker on top/bottom edges
            v = 1.0 - abs(ty - 0.5) * 1.4
            v = max(0.55, v)

            left = lerp_color(NAVY, VIOLET, ty * 0.6 + 0.1)
            right = lerp_color((30, 18, 38), WARM_DARK, ty * 0.5 + 0.2)
            base = lerp_color(left, right, tx_e)
            base = tuple(int(c * v) for c in base)
            px[x, y] = base
    return img


# ---------------- Radial glow ----------------
def add_radial_glow(img, cx, cy, radius, color, intensity=1.0):
    """Add a soft radial glow centered at (cx, cy)."""
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gpx = glow.load()
    r2 = radius * radius
    for y in range(max(0, cy - radius), min(H, cy + radius)):
        for x in range(max(0, cx - radius), min(W, cx + radius)):
            dx = x - cx
            dy = y - cy
            d2 = dx * dx + dy * dy
            if d2 < r2:
                t = 1.0 - math.sqrt(d2) / radius
                t = t ** 2.2
                t *= intensity
                gpx[x, y] = tuple(int(color[i] * t) for i in range(3))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=radius // 6))
    return ImageChops.add(img, glow)


# ---------------- Forge flame ----------------
def draw_forge_flame(img, cx, cy):
    """Draw a stylized vertical forge flame around (cx, cy)."""
    # Multiple flame layers, each blurred more, blended additively
    layers = []

    # Layer 1: outer wide warm halo
    l1 = Image.new("RGB", (W, H), (0, 0, 0))
    d1 = ImageDraw.Draw(l1)
    for i in range(40):
        rr = 180 - i * 3
        col = lerp_color((90, 30, 5), (255, 140, 40), i / 40)
        d1.ellipse(
            [cx - rr, cy - int(rr * 1.1), cx + rr, cy + int(rr * 1.0)],
            fill=col,
        )
    l1 = l1.filter(ImageFilter.GaussianBlur(radius=35))
    layers.append(l1)

    # Layer 2: tall flame tongues
    l2 = Image.new("RGB", (W, H), (0, 0, 0))
    d2 = ImageDraw.Draw(l2)
    # main upward flame body (teardrop)
    flame_pts = []
    n = 60
    for i in range(n + 1):
        t = i / n
        # parametric teardrop
        ang = math.pi * t
        # width tapers at top
        wmod = math.sin(ang) * (1.0 - t * 0.7)
        x = cx + math.cos(ang + math.pi / 2) * 95 * wmod
        y = cy - lerp(-60, 230, t) + math.sin(ang) * 5
        flame_pts.append((x, y))
    # back side
    for i in range(n + 1):
        t = 1 - i / n
        ang = math.pi * t
        wmod = math.sin(ang) * (1.0 - t * 0.7)
        x = cx - math.cos(ang + math.pi / 2) * 95 * wmod
        y = cy - lerp(-60, 230, t) + math.sin(ang) * 5
        flame_pts.append((x, y))
    d2.polygon(flame_pts, fill=(255, 150, 50))
    l2 = l2.filter(ImageFilter.GaussianBlur(radius=18))
    layers.append(l2)

    # Layer 3: inner bright core
    l3 = Image.new("RGB", (W, H), (0, 0, 0))
    d3 = ImageDraw.Draw(l3)
    core_pts = []
    n = 50
    for i in range(n + 1):
        t = i / n
        ang = math.pi * t
        wmod = math.sin(ang) * (1.0 - t * 0.6)
        x = cx + math.cos(ang + math.pi / 2) * 55 * wmod
        y = cy - lerp(-30, 170, t)
        core_pts.append((x, y))
    for i in range(n + 1):
        t = 1 - i / n
        ang = math.pi * t
        wmod = math.sin(ang) * (1.0 - t * 0.6)
        x = cx - math.cos(ang + math.pi / 2) * 55 * wmod
        y = cy - lerp(-30, 170, t)
        core_pts.append((x, y))
    d3.polygon(core_pts, fill=(255, 220, 150))
    l3 = l3.filter(ImageFilter.GaussianBlur(radius=10))
    layers.append(l3)

    # Layer 4: white-hot center
    l4 = Image.new("RGB", (W, H), (0, 0, 0))
    d4 = ImageDraw.Draw(l4)
    d4.ellipse([cx - 30, cy - 60, cx + 30, cy + 80], fill=(255, 245, 210))
    d4.ellipse([cx - 18, cy - 100, cx + 18, cy + 30], fill=(255, 250, 230))
    l4 = l4.filter(ImageFilter.GaussianBlur(radius=8))
    layers.append(l4)

    # blend additively
    for layer in layers:
        img = ImageChops.add(img, layer)
    return img


# ---------------- Mechanical claw ----------------
def draw_claw(img, cx, cy):
    """Draw a 3-prong cyber claw above the flame, prongs gripping downward into it."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Wrist / base disc (top, anchoring claw)
    base_y = cy - 230
    base_r = 55
    # Outer ring
    d.ellipse(
        [cx - base_r - 6, base_y - base_r - 6, cx + base_r + 6, base_y + base_r + 6],
        fill=STEEL_DARK,
    )
    d.ellipse(
        [cx - base_r, base_y - base_r, cx + base_r, base_y + base_r],
        fill=STEEL,
    )
    # inner highlight
    d.ellipse(
        [cx - base_r + 14, base_y - base_r + 8, cx + base_r - 6, base_y + base_r - 18],
        fill=STEEL_LIGHT,
    )
    # center bolt
    d.ellipse([cx - 14, base_y - 14, cx + 14, base_y + 14], fill=(35, 40, 55))
    d.ellipse([cx - 6, base_y - 6, cx + 6, base_y + 6], fill=AMBER_BRIGHT)

    # short shaft connecting base to knuckle
    d.polygon(
        [(cx - 26, base_y + 30), (cx + 26, base_y + 30),
         (cx + 36, base_y + 80), (cx - 36, base_y + 80)],
        fill=STEEL_DARK,
    )
    d.polygon(
        [(cx - 18, base_y + 32), (cx + 18, base_y + 32),
         (cx + 26, base_y + 78), (cx - 26, base_y + 78)],
        fill=STEEL,
    )

    # knuckle hub where prongs attach
    hub_y = base_y + 95
    d.ellipse([cx - 50, hub_y - 28, cx + 50, hub_y + 28], fill=STEEL_DARK)
    d.ellipse([cx - 42, hub_y - 22, cx + 42, hub_y + 22], fill=STEEL)
    d.ellipse([cx - 30, hub_y - 16, cx + 30, hub_y + 8], fill=STEEL_LIGHT)
    d.ellipse([cx - 8, hub_y - 8, cx + 8, hub_y + 8], fill=AMBER_DEEP)

    # 3 prongs: left, center, right - gripping the flame from above
    # Each prong has 2 segments + sharp tip
    def draw_prong(angle_deg, length_a=70, length_b=85, side="c"):
        ang = math.radians(angle_deg)
        # Joint A (top of upper segment)
        ax, ay = cx, hub_y + 10
        # Joint B (between segments)
        bx = ax + math.sin(ang) * length_a
        by = ay + math.cos(ang) * length_a
        # Tip - bend inward
        bend = math.radians(angle_deg * 0.45 + (angle_deg / abs(angle_deg) * -25 if angle_deg != 0 else 0))
        tx = bx + math.sin(bend) * length_b
        ty = by + math.cos(bend) * length_b

        # Upper segment (thicker)
        seg_w_top = 22
        seg_w_mid = 16
        # perpendicular vectors
        pax, pay = math.cos(ang), -math.sin(ang)
        pbx, pby = math.cos(bend), -math.sin(bend)
        # upper segment polygon
        upper = [
            (ax + pax * seg_w_top, ay + pay * seg_w_top),
            (ax - pax * seg_w_top, ay - pay * seg_w_top),
            (bx - pax * seg_w_mid, by - pay * seg_w_mid),
            (bx + pax * seg_w_mid, by + pay * seg_w_mid),
        ]
        # outline (dark)
        outline = [
            (ax + pax * (seg_w_top + 4), ay + pay * (seg_w_top + 4)),
            (ax - pax * (seg_w_top + 4), ay - pay * (seg_w_top + 4)),
            (bx - pax * (seg_w_mid + 4), by - pay * (seg_w_mid + 4)),
            (bx + pax * (seg_w_mid + 4), by + pay * (seg_w_mid + 4)),
        ]
        d.polygon(outline, fill=STEEL_DARK)
        d.polygon(upper, fill=STEEL)
        # specular highlight strip
        hl = [
            (ax + pax * (seg_w_top - 6), ay + pay * (seg_w_top - 6)),
            (ax + pax * (seg_w_top - 14), ay + pay * (seg_w_top - 14)),
            (bx + pax * (seg_w_mid - 10), by + pay * (seg_w_mid - 10)),
            (bx + pax * (seg_w_mid - 4), by + pay * (seg_w_mid - 4)),
        ]
        d.polygon(hl, fill=STEEL_LIGHT)

        # Joint sphere at B
        d.ellipse([bx - 16, by - 16, bx + 16, by + 16], fill=STEEL_DARK)
        d.ellipse([bx - 12, by - 12, bx + 12, by + 12], fill=STEEL)
        d.ellipse([bx - 6, by - 9, bx + 4, by + 1], fill=STEEL_LIGHT)
        # tiny amber LED
        d.ellipse([bx - 3, by - 3, bx + 3, by + 3], fill=AMBER_BRIGHT)

        # Lower segment tapering to sharp tip
        seg_w_low = 13
        # tip is a sharp point along bend direction
        tip_x = tx
        tip_y = ty
        lower_outline = [
            (bx + pbx * (seg_w_low + 3), by + pby * (seg_w_low + 3)),
            (bx - pbx * (seg_w_low + 3), by - pby * (seg_w_low + 3)),
            (tip_x - pbx * 2, tip_y - pby * 2),
            (tip_x + pbx * 2, tip_y + pby * 2),
        ]
        lower = [
            (bx + pbx * seg_w_low, by + pby * seg_w_low),
            (bx - pbx * seg_w_low, by - pby * seg_w_low),
            (tip_x, tip_y),
        ]
        d.polygon(lower_outline, fill=STEEL_DARK)
        d.polygon(lower, fill=STEEL)
        # highlight
        d.polygon([
            (bx + pbx * (seg_w_low - 4), by + pby * (seg_w_low - 4)),
            (bx + pbx * (seg_w_low - 9), by + pby * (seg_w_low - 9)),
            (tip_x, tip_y),
        ], fill=STEEL_LIGHT)

        return tip_x, tip_y

    # 3 prongs: left, center-front, right
    # angles measured from straight down (0 = down)
    tip_l = draw_prong(-32, length_a=75, length_b=90, side="l")
    tip_c = draw_prong(0, length_a=80, length_b=95, side="c")
    tip_r = draw_prong(32, length_a=75, length_b=90, side="r")

    # paste overlay
    img.paste(overlay, (0, 0), overlay)
    return img, [tip_l, tip_c, tip_r]


# ---------------- Tip glow (where claw meets flame) ----------------
def add_tip_glow(img, tips):
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    for tx, ty in tips:
        for r in range(40, 0, -4):
            alpha = (1 - r / 40)
            col = tuple(int(c * alpha * 0.9) for c in (255, 180, 80))
            d.ellipse([tx - r, ty - r, tx + r, ty + r], fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=10))
    return ImageChops.add(img, glow)


# ---------------- Code particles & YAML fragments ----------------
def draw_code_layer(img):
    """Middle third: glowing YAML/code fragments dissolving into light streaks."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # syntax fragments to scatter
    fragments = [
        "{ }", "[ ]", "<>", "/>", "()", "::", "—", "—",
        "•", "▸", "0x", "01", "10", "$", "//",
    ]

    # We'll render small geometric "code chips" - little rounded rectangles
    # with bracket symbols inside, glowing.
    rng = random.Random(7)
    chips = []
    # area: roughly x in [560, 1280], y in [100, 540]
    n_chips = 55
    for i in range(n_chips):
        # bias x toward middle, drifting right as t grows
        t = i / n_chips
        x = int(lerp(560, 1300, t) + rng.uniform(-60, 60))
        y = int(lerp(150, 500, rng.random()) + math.sin(t * 6) * 40)
        size = rng.choice([8, 10, 12, 14, 16])
        # color shifts: amber on left -> cyan/violet in middle -> amber again right
        if t < 0.35:
            base = lerp_color(AMBER, AMBER_BRIGHT, rng.random())
        elif t < 0.7:
            base = lerp_color(CODE_CYAN, CODE_VIOLET, rng.random())
        else:
            base = lerp_color(AMBER_BRIGHT, AMBER, rng.random())
        chips.append((x, y, size, base, rng.choice(fragments)))

    # draw chips on a separate layer for glow
    chips_layer = Image.new("RGB", (W, H), (0, 0, 0))
    cd = ImageDraw.Draw(chips_layer)
    for x, y, s, col, frag in chips:
        # tiny rounded rect
        cd.rounded_rectangle(
            [x - s, y - s // 2, x + s, y + s // 2],
            radius=3,
            outline=col,
            width=1,
        )
        # cap dots
        cd.ellipse([x - s + 2, y - 1, x - s + 4, y + 1], fill=col)

    # blurred glow copy
    chips_glow = chips_layer.filter(ImageFilter.GaussianBlur(radius=4))
    img = ImageChops.add(img, chips_glow)
    # sharper layer dimmed
    img = ImageChops.add(img, ImageChops.multiply(chips_layer, Image.new("RGB", (W, H), (180, 180, 180))))

    # Light streaks - horizontal motion blur lines connecting code -> right
    streaks = Image.new("RGB", (W, H), (0, 0, 0))
    sd = ImageDraw.Draw(streaks)
    for i in range(28):
        y = int(lerp(180, 480, rng.random()))
        x1 = int(lerp(620, 1100, rng.random()))
        length = rng.randint(120, 320)
        x2 = x1 + length
        # color amber-leaning
        col = lerp_color((180, 90, 30), (255, 200, 110), rng.random())
        sd.line([(x1, y), (x2, y)], fill=col, width=1)
    streaks = streaks.filter(ImageFilter.GaussianBlur(radius=2.5))
    img = ImageChops.add(img, streaks)

    # composite the alpha overlay (currently empty but reserved)
    img.paste(overlay, (0, 0), overlay)
    return img


# ---------------- Play button (right third) ----------------
def draw_play_button(img, cx, cy, radius=145):
    """Draw stylized play button forged from amber glow."""
    # Outer glow halo
    halo = Image.new("RGB", (W, H), (0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r in range(radius + 90, radius - 10, -2):
        t = (r - (radius - 10)) / 100
        col = tuple(int(c * (1 - t) ** 2 * 0.55) for c in (255, 150, 50))
        hd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    halo = halo.filter(ImageFilter.GaussianBlur(radius=22))
    img = ImageChops.add(img, halo)

    # Ring (the circle)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # outer dim ring
    d.ellipse(
        [cx - radius - 6, cy - radius - 6, cx + radius + 6, cy + radius + 6],
        outline=(120, 60, 20, 255),
        width=4,
    )
    # main bright ring
    d.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        outline=AMBER_BRIGHT,
        width=6,
    )
    # inner subtle ring
    d.ellipse(
        [cx - radius + 14, cy - radius + 14, cx + radius - 14, cy + radius - 14],
        outline=(255, 180, 90, 180),
        width=2,
    )

    # Triangle (play)
    tri_size = int(radius * 0.55)
    # Equilateral-ish, point right, optical centering
    offset_x = int(tri_size * 0.18)
    triangle = [
        (cx - tri_size // 2 + offset_x, cy - int(tri_size * 0.85)),
        (cx - tri_size // 2 + offset_x, cy + int(tri_size * 0.85)),
        (cx + tri_size + offset_x, cy),
    ]
    # outer fill
    d.polygon(triangle, fill=(255, 195, 110, 255))
    # inner brighter core (slightly smaller)
    inner_tri = [
        (cx - tri_size // 2 + offset_x + 8, cy - int(tri_size * 0.7)),
        (cx - tri_size // 2 + offset_x + 8, cy + int(tri_size * 0.7)),
        (cx + tri_size + offset_x - 14, cy),
    ]
    d.polygon(inner_tri, fill=(255, 230, 170, 255))

    img.paste(overlay, (0, 0), overlay)

    # Inner triangle glow
    tri_glow = Image.new("RGB", (W, H), (0, 0, 0))
    tgd = ImageDraw.Draw(tri_glow)
    tgd.polygon(triangle, fill=(255, 180, 80))
    tri_glow = tri_glow.filter(ImageFilter.GaussianBlur(radius=14))
    img = ImageChops.add(img, tri_glow)

    return img


# ---------------- Connecting energy stream from flame to button ----------------
def draw_energy_stream(img, x1, y1, x2, y2):
    streak = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(streak)
    # bezier-ish curve points
    pts = []
    n = 80
    cx1 = x1 + (x2 - x1) * 0.35
    cy1 = y1 - 60
    cx2 = x1 + (x2 - x1) * 0.7
    cy2 = y2 + 40
    for i in range(n + 1):
        t = i / n
        # cubic bezier
        u = 1 - t
        bx = u**3 * x1 + 3*u**2*t*cx1 + 3*u*t**2*cx2 + t**3*x2
        by = u**3 * y1 + 3*u**2*t*cy1 + 3*u*t**2*cy2 + t**3*y2
        pts.append((bx, by))
    # draw thick warm line then thin bright
    for w, col in [(8, (120, 50, 15)), (4, (220, 110, 40)), (2, (255, 200, 120))]:
        d.line(pts, fill=col, width=w)
    streak = streak.filter(ImageFilter.GaussianBlur(radius=4))
    img = ImageChops.add(img, streak)
    return img


# ---------------- Embers / sparks ----------------
def draw_embers(img):
    overlay = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(overlay)
    rng = random.Random(11)
    # ~180 small embers, denser near flame & play button
    for _ in range(200):
        # weighted distribution
        zone = rng.random()
        if zone < 0.45:
            # near flame (left)
            cx = rng.gauss(420, 140)
            cy = rng.gauss(360, 130)
        elif zone < 0.75:
            # middle drift
            cx = rng.uniform(560, 1280)
            cy = rng.uniform(120, 540)
        else:
            # near play button
            cx = rng.gauss(1500, 130)
            cy = rng.gauss(330, 130)
        if not (0 <= cx < W and 0 <= cy < H):
            continue
        size = rng.choice([1, 1, 1, 2, 2, 3])
        # warm color
        bright = rng.uniform(0.55, 1.0)
        col = (int(255 * bright), int(180 * bright), int(70 * bright))
        d.ellipse([cx - size, cy - size, cx + size, cy + size], fill=col)
    # blurred halo
    halo = overlay.filter(ImageFilter.GaussianBlur(radius=2.5))
    out = ImageChops.add(img, halo)
    # punchy sharp dots
    out = ImageChops.add(out, overlay)

    # a few longer rising sparks (vertical streaks) above flame
    streaks = Image.new("RGB", (W, H), (0, 0, 0))
    sd = ImageDraw.Draw(streaks)
    for _ in range(18):
        x = int(rng.gauss(420, 80))
        y_top = int(rng.uniform(80, 260))
        y_bot = y_top + rng.randint(20, 80)
        col = (255, 180, 80)
        sd.line([(x, y_top), (x + rng.randint(-3, 3), y_bot)], fill=col, width=1)
    streaks = streaks.filter(ImageFilter.GaussianBlur(radius=1.5))
    out = ImageChops.add(out, streaks)
    return out


# ---------------- Atmospheric haze ----------------
def add_haze(img):
    haze = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(haze)
    # soft warm glow under flame
    d.ellipse([180, 380, 700, 720], fill=(80, 30, 10))
    # cool violet glow upper-left for code area
    d.ellipse([400, -100, 1100, 320], fill=(40, 25, 70))
    # warm right-side glow under play button
    d.ellipse([1200, 250, 1900, 700], fill=(70, 30, 15))
    haze = haze.filter(ImageFilter.GaussianBlur(radius=120))
    return ImageChops.add(img, haze)


# ---------------- Vignette ----------------
def apply_vignette(img):
    vig = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(vig)
    d.ellipse([-300, -200, W + 300, H + 200], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(radius=150))
    arr = vig.load()
    out = img.copy()
    opx = out.load()
    for y in range(H):
        for x in range(W):
            v = arr[x, y] / 255.0
            v = 0.55 + v * 0.45  # don't fully darken
            r, g, b = opx[x, y]
            opx[x, y] = (int(r * v), int(g * v), int(b * v))
    return out


# ---------------- Compose ----------------
def main():
    img = make_background()
    img = add_haze(img)

    # forge flame center
    flame_cx, flame_cy = 420, 380

    # background radial bloom under flame
    img = add_radial_glow(img, flame_cx, flame_cy + 30, 380, (180, 90, 30), intensity=0.9)

    # flame
    img = draw_forge_flame(img, flame_cx, flame_cy)

    # claw above flame, prongs reaching down into top of flame
    img, tips = draw_claw(img, flame_cx, flame_cy)

    # tip glows where prongs meet flame
    img = add_tip_glow(img, tips)

    # code particles middle
    img = draw_code_layer(img)

    # energy stream from flame to play button
    img = draw_energy_stream(img, flame_cx + 120, flame_cy - 20, 1500, 360)

    # play button right
    img = draw_play_button(img, 1500, 360, radius=145)

    # final embers/sparks
    img = draw_embers(img)

    # vignette
    img = apply_vignette(img)

    # final color punch — slight warm tint right side via ImageChops
    out_path = "/home/drsolodev/clawforge/assets/hero-banner.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    print(f"Size: {img.size}")


if __name__ == "__main__":
    main()
