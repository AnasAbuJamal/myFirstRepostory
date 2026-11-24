"""Build LumenVale: City of Knowledge (clean Three.js r180 + Blender GLB architecture)."""
from argparse import ArgumentParser
from pathlib import Path
import shutil

HERE = Path(__file__).resolve().parent

def build(destination: Path):
    out_dir = destination.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(HERE / 'index.html', destination)
    for folder in ('src', 'vendor', 'assets'):
        src = HERE / folder
        if src.is_dir():
            shutil.copytree(src, out_dir / folder, dirs_exist_ok=True)
    print(f'Built clean LumenVale v2 -> {destination}')

if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=HERE.parent / 'dist' / 'index.html')
    build(parser.parse_args().output)
