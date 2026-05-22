from PIL import Image
import os

src = os.path.join('public', 'gallery-2.jpeg')
png = os.path.join('public', 'favicon.png')
print('Loading',src)
img = Image.open(src).convert('RGBA')
# center-crop square
w,h = img.size
side = min(w,h)
left = (w - side)//2
top = (h - side)//2
crop = img.crop((left, top, left+side, top+side))
# resize to 512x512
out = crop.resize((512,512), Image.LANCZOS)
out.save(png, format='PNG')
print('Saved',png)
