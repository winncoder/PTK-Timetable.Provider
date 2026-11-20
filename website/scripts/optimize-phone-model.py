#!/usr/bin/env python3
"""Resize embedded GLB textures for the PTK website (requires Pillow).

Usage: python3 scripts/optimize-phone-model.py original.glb public/models/ptk-phone.glb
The model is Innerscene's CC0 'Open foldable phone'; see public/models/README.md.
Geometry and material assignments are preserved, while embedded textures are
scaled down for a small on-page hero illustration. This script makes no network
requests and does not overwrite the input file.
"""
import io
import json
import struct
import sys
from pathlib import Path
from PIL import Image

if len(sys.argv) != 3:
    raise SystemExit('Usage: optimize-phone-model.py original.glb output.glb')
source, destination = map(Path, sys.argv[1:])
if source.resolve() == destination.resolve():
    raise SystemExit('Input and output must be different files.')
data = source.read_bytes()
magic, version, total = struct.unpack_from('<4sII', data, 0)
if magic != b'glTF' or version != 2 or total != len(data):
    raise SystemExit('Input is not a valid glTF 2.0 binary.')
json_len, json_type = struct.unpack_from('<I4s', data, 12)
if json_type != b'JSON':
    raise SystemExit('GLB JSON chunk missing.')
doc = json.loads(data[20:20 + json_len])
bin_start = 20 + json_len
bin_len, bin_type = struct.unpack_from('<I4s', data, bin_start)
if bin_type != b'BIN\x00' or len(doc.get('buffers', [])) != 1:
    raise SystemExit('Expected one GLB buffer.')
bin_data = data[bin_start + 8:bin_start + 8 + bin_len]
images = {entry['bufferView']: entry for entry in doc.get('images', []) if 'bufferView' in entry}
new_bin = bytearray()
for index, view in enumerate(doc.get('bufferViews', [])):
    if view.get('buffer', 0) != 0:
        raise SystemExit('External buffers are not supported.')
    start = view.get('byteOffset', 0)
    raw = bin_data[start:start + view['byteLength']]
    if len(raw) != view['byteLength']:
        raise SystemExit('Invalid bufferView range.')
    image = images.get(index)
    if image:
        with Image.open(io.BytesIO(raw)) as texture:
            texture.load()
            texture.thumbnail((512, 512), Image.Resampling.LANCZOS)
            out = io.BytesIO()
            if texture.mode in ('RGB', 'L'):
                texture.convert('RGB').save(out, format='JPEG', quality=82, optimize=True, progressive=False, subsampling=0)
                image['mimeType'] = 'image/jpeg'
            else:
                texture.save(out, format='PNG', optimize=True)
                image['mimeType'] = 'image/png'
            raw = out.getvalue()
    while len(new_bin) % 4:
        new_bin.append(0)
    view['byteOffset'] = len(new_bin)
    view['byteLength'] = len(raw)
    new_bin.extend(raw)
while len(new_bin) % 4:
    new_bin.append(0)
doc['buffers'][0]['byteLength'] = len(new_bin)
json_data = json.dumps(doc, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
json_data += b' ' * ((-len(json_data)) % 4)
result = (struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(json_data) + 8 + len(new_bin))
          + struct.pack('<I4s', len(json_data), b'JSON') + json_data
          + struct.pack('<I4s', len(new_bin), b'BIN\x00') + new_bin)
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(result)
print(f'Wrote {destination}: {len(result):,} bytes (source {len(data):,} bytes)')
