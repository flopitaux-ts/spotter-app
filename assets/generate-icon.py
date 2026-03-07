"""Generate macOS .iconset from a source PNG image."""
from PIL import Image
import os, subprocess

source = os.path.join(os.path.dirname(__file__), 'logo-source.png')
img = Image.open(source).convert('RGBA')

# Ensure square by cropping to center square
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

iconset_dir = os.path.join(os.path.dirname(__file__), 'icon.iconset')
os.makedirs(iconset_dir, exist_ok=True)

icon_sizes = [16, 32, 64, 128, 256, 512, 1024]
for s in icon_sizes:
    resized = img.resize((s, s), Image.LANCZOS)
    resized.save(os.path.join(iconset_dir, f'icon_{s}x{s}.png'))
    if s <= 512:
        resized2x = img.resize((s * 2, s * 2), Image.LANCZOS)
        resized2x.save(os.path.join(iconset_dir, f'icon_{s}x{s}@2x.png'))

print(f'Generated iconset at {iconset_dir}')
