"""Build index.html for Format Bin from template.html, lemo.json and the house format registry.

Run after adding a format to videos/formats/registry.json, then republish index.html with thumbs/.
"""
import json
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REGISTRY = '/Users/TonyStark/Desktop/web/videos/formats/registry.json'

house = json.load(open(REGISTRY))
for h in house:
	out = os.path.join(HERE, 'thumbs', h['id'].replace(':', '-') + '.webp')
	if os.path.exists(h['thumb']) and (not os.path.exists(out) or os.path.getmtime(h['thumb']) > os.path.getmtime(out)):
		im = Image.open(h['thumb']).convert('RGB')
		w = 640 if im.width >= im.height else 360
		im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(out, 'WEBP', quality=74)
	h.pop('thumb')

lemo = json.load(open(os.path.join(HERE, 'lemo.json')))
page = open(os.path.join(HERE, 'template.html')).read()
page = page.replace('/*LEMO_DATA*/', json.dumps(lemo, ensure_ascii=False)).replace('/*HOUSE_DATA*/', json.dumps(house, ensure_ascii=False))
open(os.path.join(HERE, 'index.html'), 'w').write(page)
print(f'index.html: {len(house)} house, {len(lemo) - 1} lemo formats; thumbs: {len(os.listdir(os.path.join(HERE, "thumbs")))}')
