import os
import zipfile
import shutil

ROOT = r'd:\dev\web\pitocodegentebot'
DISCLOUD_DIR = os.path.join(ROOT, 'discloud')
SERVER_DIR = os.path.join(ROOT, 'server')
DISCLOUD_SERVER_DIR = os.path.join(DISCLOUD_DIR, 'server')
ZIP_OUT = os.path.join(ROOT, 'pitoco.zip')

if os.path.exists(ZIP_OUT):
    os.remove(ZIP_OUT)

# 1. Sincronizar server/ com discloud/server/
if os.path.exists(DISCLOUD_SERVER_DIR):
    shutil.rmtree(DISCLOUD_SERVER_DIR)
shutil.copytree(SERVER_DIR, DISCLOUD_SERVER_DIR)
print(f'[OK] Sincronizado {SERVER_DIR} -> {DISCLOUD_SERVER_DIR}')

# Arquivos base na raiz do pacote Discloud
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

    # Incluir pasta server/ completa no pacote
    if os.path.exists(SERVER_DIR):
        for root, dirs, files in os.walk(SERVER_DIR):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, ROOT)
                zf.write(full_p, rel_p)
        print('[OK] Added server/ folder to zip')

    # Incluir pasta dist/ se presente
    dist_dir = os.path.join(ROOT, 'dist')
    if os.path.exists(dist_dir):
        for root, dirs, files in os.walk(dist_dir):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, ROOT)
                zf.write(full_p, rel_p)
        print('[OK] Added dist/ folder to zip')

print(f'[OK] Created {ZIP_OUT}, total size: {os.path.getsize(ZIP_OUT)} bytes')
