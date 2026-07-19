from PIL import Image
from pathlib import Path


def key_black(src: Path, dst: Path, threshold=28, softness=18):
    im = Image.open(src).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            mx = max(r, g, b)
            if mx <= threshold:
                pixels[x, y] = (r, g, b, 0)
            elif mx < threshold + softness:
                t = (mx - threshold) / softness
                pixels[x, y] = (r, g, b, int(a * t))
    im.save(dst, "PNG")
    print(f"wrote {dst} ({dst.stat().st_size} bytes)")


base = Path(
    r"C:\Users\Joshu\Desktop\Tame Dynamics\Client\Newphase Coaching\public\brand\coaches"
)
for name in ("siegwalt.png", "hadley.png"):
    p = base / name
    key_black(p, p)
