import os
import zipfile
import shutil

ROOT = r'd:\dev\web\pitocodegentebot'
DISCLOUD_DIR = os.path.join(ROOT, 'discloud')
ZIP_OUT = os.path.join(ROOT, 'pitoco.zip')

if os.path.exists(ZIP_OUT):
    os.remove(ZIP_OUT)

# Files to include directly from discloud directory or root
files_to_zip = [
    (os.path.join(DISCLOUD_DIR, 'discloud.config'), 'discloud.config'),
    (os.path.join(DISCLOUD_DIR, 'package.json'), 'package.json'),
    (os.path.join(DISCLOUD_DIR, 'index.js'), 'index.js'),
    (os.path.join(DISCLOUD_DIR, 'server.js'), 'server.js'),
    (os.path.join(DISCLOUD_DIR, '.env'), '.env'),
]

with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for src, arcname in files_to_zip:
        if os.path.exists(src):
            zf.write(src, arcname)
            print(f'Added {arcname} ({os.path.getsize(src)} bytes)')
        else:
            print(f'WARNING: {src} does not exist!')
            
    # Include dist folder if present
    dist_dir = os.path.join(ROOT, 'dist')
    if os.path.exists(dist_dir):
        for root, dirs, files in os.walk(dist_dir):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, ROOT)
                zf.write(full_p, rel_p)
        print('Added dist folder to zip')

print(f'Created {ZIP_OUT}, total size: {os.path.getsize(ZIP_OUT)} bytes')
