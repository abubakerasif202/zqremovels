from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


if __name__ == '__main__':
    run(['python', 'scripts/optimize_images.py'])
    run(['node', 'scripts/build-site.mjs'])
