"""Build the single-file, offline Market Office game with Python 3."""
from argparse import ArgumentParser
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent

def source(name):
    return (HERE / name).read_text(encoding='utf-8')

def inside_script(code):
    return re.sub(r'</script', lambda match: '<\\/' + match[0][2:], code, flags=re.IGNORECASE)

def build():
    assets = {
        '/* GAME STYLES */': source('style.css') + '\n' + source('walking.css'),
        '/* GAME ENGINE */': inside_script('/*\n' + source('vendor/THREE-LICENSE.txt') + '*/\n' + source('vendor/three.js')),
        '/* GAME CODE */': inside_script(
            '\n\n'.join(source(name) for name in ('story.js', 'rules.js', 'walk.js', 'software.js', 'view.js', 'reports.js', 'app.js'))
        ),
    }
    page = source('template.html')
    for marker, value in assets.items():
        assert page.count(marker) == 1, marker
        page = page.replace(marker, value, 1)
    return page

if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=HERE / 'dist' / 'index.html')
    destination = parser.parse_args().output
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(build(), encoding='utf-8')
    print(f'Built {destination}')

