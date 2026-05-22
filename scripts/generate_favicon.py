from PIL import Image
import os

src = os.path.join('public', 'gallery-2.jpeg')
ico = os.path.join('public', 'favicon.ico')
print('Loading', src)
img = Image.open(src).convert('RGBA')
size = 512
bg = Image.new('RGBA', (size, size), (255, 255, 255, 0))
w, h = img.size
scale = min(size / w, size / h)
neww, newh = int(w * scale), int(h * scale)
resized = img.resize((neww, newh), Image.LANCZOS)
bg.paste(resized, ((size - neww) // 2, (size - newh) // 2), resized)
# Save ICO with multiple sizes
sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
print('Saving', ico, 'with sizes', sizes)
bg.save(ico, format='ICO', sizes=sizes)
print('Done')
