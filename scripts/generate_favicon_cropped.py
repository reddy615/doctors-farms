from PIL import Image
import os

src = os.path.join('public', 'gallery-2.jpeg')
ico = os.path.join('public', 'favicon.ico')
print('Loading', src)
img = Image.open(src).convert('RGBA')
w, h = img.size
# Crop center square with a slight inset to focus logo
side = min(w, h)
crop_ratio = 0.78
crop_size = int(side * crop_ratio)
left = max(0, (w - crop_size) // 2)
top = max(0, (h - crop_size) // 2)
right = left + crop_size
bottom = top + crop_size
cropped = img.crop((left, top, right, bottom))
# Sample background color from top-left pixel of original
bg_sample = img.convert('RGB').getpixel((0,0))
print('Background color sampled:', bg_sample)
# Create square canvas and paste resized cropped image centered
size = 512
bg = Image.new('RGBA', (size, size), bg_sample + (255,))
w2, h2 = cropped.size
scale = min(size / w2, size / h2)
neww, newh = int(w2 * scale), int(h2 * scale)
resized = cropped.resize((neww, newh), Image.LANCZOS)
bg.paste(resized, ((size - neww) // 2, (size - newh) // 2), resized)
# Save ICO with multiple sizes
sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
print('Saving', ico, 'with sizes', sizes)
bg.save(ico, format='ICO', sizes=sizes)
print('Done')
