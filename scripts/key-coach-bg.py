"""Flood-fill key: remove connected dark background from image edges."""
from collections import deque
from pathlib import Path

from PIL import Image


def flood_key(src: Path, dst: Path, threshold: int = 42) -> None:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 8:
            return True
        return max(r, g, b) <= threshold and abs(r - g) < 12 and abs(g - b) < 12

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    # Seed from all edge pixels that look like background
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y):
                q.append((x, y))
                visited[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_bg(x, y):
                q.append((x, y))
                visited[y][x] = True

    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                visited[ny][nx] = True
                if is_bg(nx, ny):
                    q.append((nx, ny))

    # Soft fringe cleanup: any remaining near-black low-alpha-ish edge neighbors
    soft = Image.new("L", (w, h), 255)
    soft_px = soft.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                soft_px[x, y] = 0
            elif max(r, g, b) <= threshold + 20 and any(
                0 <= x + dx < w
                and 0 <= y + dy < h
                and px[x + dx, y + dy][3] == 0
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))
            ):
                # fade fringe
                fade = max(0, min(255, int((max(r, g, b) - threshold) / 20 * 255)))
                px[x, y] = (r, g, b, fade)
                soft_px[x, y] = fade

    im.save(dst, "PNG")
    # stats
    data = list(im.getdata())
    transparent = sum(1 for p in data if p[3] < 10)
    print(f"{dst.name}: {w}x{h}, transparent={transparent}/{len(data)}")


base = Path(
    r"C:\Users\Joshu\Desktop\Tame Dynamics\Client\Newphase Coaching\public\brand\coaches"
)
# Prefer originals if we still have pre-key copies in assets; else re-key current
sources = {
    "siegwalt.png": Path(
        r"C:\Users\Joshu\.cursor\projects\c-Users-Joshu-Desktop-Tame-Dynamics-Client-Newphase-Coaching\assets\c__Users_Joshu_AppData_Roaming_Cursor_User_workspaceStorage_fabae64baf909960f841322216a4785a_images_sigs-44895638-1409-4c3c-9831-b4426760d427.png"
    ),
    "hadley.png": Path(
        r"C:\Users\Joshu\.cursor\projects\c-Users-Joshu-Desktop-Tame-Dynamics-Client-Newphase-Coaching\assets\c__Users_Joshu_AppData_Roaming_Cursor_User_workspaceStorage_fabae64baf909960f841322216a4785a_images_hads-cf3d700e-5a65-4bb2-8528-fffda4218fa1.png"
    ),
}

for name, src in sources.items():
    if not src.exists():
        src = base / name
    flood_key(src, base / name, threshold=48)
