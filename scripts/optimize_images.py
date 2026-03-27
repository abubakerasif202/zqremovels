from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (ROOT / 'brand-logo.png', ROOT / 'brand-logo.webp', 90),
    (ROOT / 'screen.png', ROOT / 'screen.webp', 84),
    (ROOT / 'zq-removals-social-share.png', ROOT / 'zq-removals-social-share.webp', 86),
]


def build_webp(source: Path, target: Path, quality: int) -> None:
    if not source.exists():
        return
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return

    with Image.open(source) as image:
        converted = image.convert('RGBA') if image.mode in {'RGBA', 'LA'} else image.convert('RGB')
        converted.save(target, 'WEBP', quality=quality, method=6)


if __name__ == '__main__':
    for source, target, quality in TARGETS:
        build_webp(source, target, quality)
        print(f'optimized {target.relative_to(ROOT)}')
