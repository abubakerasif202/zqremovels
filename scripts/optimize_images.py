from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (ROOT / 'brand-logo.png', ROOT / 'brand-logo.webp', 90),
    (ROOT / 'screen.png', ROOT / 'screen.webp', 84),
    (ROOT / 'zq-removals-social-share.png', ROOT / 'zq-removals-social-share.webp', 86),
]
CUSTOM_GRID_SOURCE = ROOT / 'media' / 'custom-photo-pack-grid.png'
CUSTOM_DIRECT_VARIANTS = [
    {
        'source': ROOT / 'media' / 'custom-local-source.png',
        'target': ROOT / 'media' / 'zq-local-premium.webp',
        'crop': (0.0, 0.0, 0.95, 1.0),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.02,
        'contrast': 1.03,
        'color': 0.97,
        'overlay': (244, 230, 203, 8),
        'centering': (0.42, 0.56),
    },
    {
        'source': ROOT / 'media' / 'custom-interstate-source.png',
        'target': ROOT / 'media' / 'zq-interstate-premium.webp',
        'crop': (0.0, 0.0, 0.95, 1.0),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.01,
        'contrast': 1.05,
        'color': 0.96,
        'overlay': (23, 52, 82, 10),
        'centering': (0.42, 0.52),
    },
    {
        'source': ROOT / 'media' / 'custom-operations-source.png',
        'target': ROOT / 'media' / 'zq-operations-premium.webp',
        'crop': (0.0, 0.0, 0.95, 1.0),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 0.99,
        'contrast': 1.06,
        'color': 0.95,
        'overlay': (17, 35, 56, 14),
        'centering': (0.4, 0.54),
    },
    {
        'source': ROOT / 'media' / 'custom-service-source.png',
        'target': ROOT / 'media' / 'zq-service-premium.webp',
        'crop': (0.0, 0.0, 0.94, 1.0),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.02,
        'contrast': 1.04,
        'color': 0.95,
        'overlay': (209, 156, 86, 10),
        'centering': (0.34, 0.44),
    },
]
DEFAULT_PHOTO_VARIANTS = [
    {
        'source': ROOT / 'zq-removals-social-share.png',
        'target': ROOT / 'media' / 'zq-local-premium.webp',
        'crop': (0.02, 0.08, 0.82, 0.94),
        'size': (1440, 1080),
        'quality': 88,
        'brightness': 1.03,
        'contrast': 1.05,
        'color': 0.92,
        'overlay': (244, 230, 203, 12),
    },
    {
        'source': ROOT / 'zq-removals-social-share.png',
        'target': ROOT / 'media' / 'zq-interstate-premium.webp',
        'crop': (0.12, 0.05, 0.98, 0.86),
        'size': (1440, 1080),
        'quality': 88,
        'brightness': 1.0,
        'contrast': 1.08,
        'color': 0.96,
        'overlay': (23, 52, 82, 14),
    },
    {
        'source': ROOT / 'zq-removals-social-share.png',
        'target': ROOT / 'media' / 'zq-operations-premium.webp',
        'crop': (0.18, 0.12, 0.92, 0.9),
        'size': (1440, 1080),
        'quality': 88,
        'brightness': 0.98,
        'contrast': 1.12,
        'color': 0.84,
        'overlay': (17, 35, 56, 28),
    },
    {
        'source': ROOT / 'zq-removals-social-share.png',
        'target': ROOT / 'media' / 'zq-service-premium.webp',
        'crop': (0.24, 0.16, 0.96, 0.96),
        'size': (1440, 1080),
        'quality': 88,
        'brightness': 1.04,
        'contrast': 1.06,
        'color': 0.9,
        'overlay': (209, 156, 86, 18),
    },
]
CUSTOM_GRID_VARIANTS = [
    {
        'source': CUSTOM_GRID_SOURCE,
        'target': ROOT / 'media' / 'zq-local-premium.webp',
        'crop': (0.006, 0.012, 0.492, 0.492),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.02,
        'contrast': 1.03,
        'color': 0.97,
        'overlay': (244, 230, 203, 8),
        'centering': (0.48, 0.55),
    },
    {
        'source': CUSTOM_GRID_SOURCE,
        'target': ROOT / 'media' / 'zq-interstate-premium.webp',
        'crop': (0.508, 0.012, 0.994, 0.492),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.01,
        'contrast': 1.05,
        'color': 0.96,
        'overlay': (23, 52, 82, 10),
        'centering': (0.54, 0.52),
    },
    {
        'source': CUSTOM_GRID_SOURCE,
        'target': ROOT / 'media' / 'zq-operations-premium.webp',
        'crop': (0.006, 0.507, 0.492, 0.992),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 0.99,
        'contrast': 1.06,
        'color': 0.95,
        'overlay': (17, 35, 56, 14),
        'centering': (0.44, 0.56),
    },
    {
        'source': CUSTOM_GRID_SOURCE,
        'target': ROOT / 'media' / 'zq-service-premium.webp',
        'crop': (0.508, 0.507, 0.968, 0.958),
        'size': (1440, 1080),
        'quality': 90,
        'brightness': 1.02,
        'contrast': 1.04,
        'color': 0.95,
        'overlay': (209, 156, 86, 10),
        'centering': (0.34, 0.42),
    },
]
RESAMPLING = getattr(Image, 'Resampling', Image)


def build_webp(source: Path, target: Path, quality: int) -> None:
    if not source.exists():
        return
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return

    with Image.open(source) as image:
        converted = image.convert('RGBA') if image.mode in {'RGBA', 'LA'} else image.convert('RGB')
        converted.save(target, 'WEBP', quality=quality, method=6)


def build_variant(spec: dict[str, object]) -> None:
    source = spec['source']
    target = spec['target']
    quality = int(spec['quality'])
    if not source.exists():
        return
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return

    target.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        converted = image.convert('RGB')
        crop = spec['crop']
        width, height = converted.size
        left = int(width * crop[0])
        top = int(height * crop[1])
        right = int(width * crop[2])
        bottom = int(height * crop[3])
        cropped = converted.crop((left, top, right, bottom))
        fitted = ImageOps.fit(
            cropped,
            spec['size'],
            method=RESAMPLING.LANCZOS,
            centering=spec.get('centering', (0.5, 0.5)),
        )
        fitted = ImageEnhance.Brightness(fitted).enhance(float(spec['brightness']))
        fitted = ImageEnhance.Contrast(fitted).enhance(float(spec['contrast']))
        fitted = ImageEnhance.Color(fitted).enhance(float(spec['color']))

        overlay = Image.new('RGBA', fitted.size, spec['overlay'])
        final_image = Image.alpha_composite(fitted.convert('RGBA'), overlay).convert('RGB')
        final_image.save(target, 'WEBP', quality=quality, method=6)


def get_photo_variants() -> list[dict[str, object]]:
    if all(Path(spec['source']).exists() for spec in CUSTOM_DIRECT_VARIANTS):
        return CUSTOM_DIRECT_VARIANTS
    if CUSTOM_GRID_SOURCE.exists():
        return CUSTOM_GRID_VARIANTS
    return DEFAULT_PHOTO_VARIANTS


if __name__ == '__main__':
    for source, target, quality in TARGETS:
        build_webp(source, target, quality)
        print(f'optimized {target.relative_to(ROOT)}')
    for spec in get_photo_variants():
        build_variant(spec)
        print(f"optimized {spec['target'].relative_to(ROOT)}")
