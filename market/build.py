"""Build the single-file, offline Market Office game with Python 3."""
from argparse import ArgumentParser
from pathlib import Path
import re
import json

HERE = Path(__file__).resolve().parent

def source(name):
    return (HERE / name).read_text(encoding='utf-8')

def inside_script(code):
    return re.sub(r'</script', lambda match: '<\\/' + match[0][2:], code, flags=re.IGNORECASE)

def build():
    assets = {
        '/* GAME STYLES */': source('style.css') + '\n' + source('walking.css') + '\n' + source('city.css') + '\n' + source('academy.css') + '\n' + source('systems.css') + '\n' + source('campus.css') + '\n' + source('phone.css') + '\n' + source('jobs.css') + '\n' + source('pathways.css') + '\n' + source('lms.css'),
        '/* GAME ENGINE */': inside_script('/*\n' + source('vendor/THREE-LICENSE.txt') + '*/\n' + source('vendor/three.js')),
        '/* GAME CODE */': inside_script(
            'const LV_DEFAULT_ACADEMICS='+json.dumps(json.loads(source('academic-catalog.json')),ensure_ascii=False)+';\nconst LV_LMS_DEMO='+json.dumps(json.loads(source('lms-demo.json')),ensure_ascii=False)+';\nconst LV_SCHOOL_ACTIVITIES='+json.dumps(json.loads(source('school-activities.json')),ensure_ascii=False)+';\n\n' + '\n\n'.join(source(name) for name in ('story.js', 'rules.js', 'walk.js', 'districts.js', 'citizens.js', 'vehicles.js', 'city.js', 'academy.js', 'systems.js', 'campus.js', 'jobs.js', 'pathways.js', 'school-activities.js', 'lms.js', 'school-world.js', 'road-textures.js', 'city-world.js', 'systems-world.js', 'campus-world.js', 'district-world.js', 'software.js', 'view.js', 'reports.js', 'phone.js', 'app.js'))
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

