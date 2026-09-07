import os
import zipfile
import shutil
import urllib.request
import json

ROOT = r'd:\dev\web\pitocodegentebot'
DISCLOUD_DIR = os.path.join(ROOT, 'discloud')
SERVER_DIR = os.path.join(ROOT, 'server')
DISCLOUD_SERVER_DIR = os.path.join(DISCLOUD_DIR, 'server')
ZIP_OUT = os.path.join(ROOT, 'pitoco.zip')

# 1. Tentar sincronizar dados mais recentes da producao antes do empacotamento
print('[INFO] [Zip Prep] Verificando backup em tempo real da producao (Discloud)...')
try:
    req = urllib.request.Request(
        'https://pitoco.discloud.app/api/db/export',
        headers={'User-Agent': 'PitocoDeploy/2.0'}
    )
    with urllib.request.urlopen(req, timeout=4) as response:
        if response.status == 200:
            content = response.read().decode('utf-8')
            db_data = json.loads(content)
            if isinstance(db_data, dict) and ('stores' in db_data or 'flows' in db_data):
                os.makedirs(os.path.join(SERVER_DIR, 'data'), exist_ok=True)
                local_db_path = os.path.join(SERVER_DIR, 'data', 'pitoco_database.json')
                with open(local_db_path, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(db_data, indent=2))
                legacy_path = os.path.join(SERVER_DIR, 'flows_db.json')
                with open(legacy_path, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(db_data, indent=2))
                print('[OK] [Zip Prep] Banco de producao baixado e sincronizado localmente!')
except Exception as e:
    print(f'[INFO] [Zip Prep] Backup online nao disponivel ({e}). Mantendo base local.')

if os.path.exists(ZIP_OUT):
    os.remove(ZIP_OUT)

# 2. Sincronizar server/ com discloud/server/ (ignorando whatsapp_auth para proteger credenciais)
def ignore_transient(dir, files):
    ignored = []
    for f in files:
        if f == 'whatsapp_auth' or f.endswith('.log') or f.endswith('.tmp'):
            ignored.append(f)
    return ignored

if os.path.exists(DISCLOUD_SERVER_DIR):
    shutil.rmtree(DISCLOUD_SERVER_DIR)
shutil.copytree(SERVER_DIR, DISCLOUD_SERVER_DIR, ignore=ignore_transient)
print(f'[OK] Sincronizado {SERVER_DIR} -> {DISCLOUD_SERVER_DIR} (protegendo whatsapp_auth)')

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

    # Incluir pasta server/ no pacote (EXCLUINDO whatsapp_auth para nunca resetar sessao de WhatsApp nem o master backup)
    if os.path.exists(SERVER_DIR):
        for root, dirs, files in os.walk(SERVER_DIR):
            if 'whatsapp_auth' in root:
                continue
            for f in files:
                if f.endswith('.log') or f.endswith('.tmp'):
                    continue
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, ROOT)
                zf.write(full_p, rel_p)
        print('[OK] Added server/ folder to zip (whatsapp_auth preservado intacto no container)')

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
