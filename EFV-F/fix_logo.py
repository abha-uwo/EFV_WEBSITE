import base64
import re
from PIL import Image
from io import BytesIO

svg_path = "public/assets/images/AISA.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_data = f.read()

# Extract base64
match = re.search(r'data:image/png;base64,([a-zA-Z0-9+/=]+)', svg_data)
if not match:
    print("Could not find base64 image data")
    exit(1)

b64_data = match.group(1)
img_bytes = base64.b64decode(b64_data)

img = Image.open(BytesIO(img_bytes)).convert("RGBA")
pixels = img.load()

# Assuming the top-left pixel is the background color
bg_color = pixels[0, 0]
print(f"Background color detected: {bg_color}")

# Tolerance for background color
def is_bg(color, bg, tol=15):
    return abs(color[0]-bg[0]) < tol and abs(color[1]-bg[1]) < tol and abs(color[2]-bg[2]) < tol

# Also remove pure black or very dark colors
for y in range(img.height):
    for x in range(img.width):
        p = pixels[x, y]
        if is_bg(p, bg_color) or (p[0] < 20 and p[1] < 20 and p[2] < 20):
            pixels[x, y] = (0, 0, 0, 0)

out_buffer = BytesIO()
img.save(out_buffer, format="PNG")
new_b64 = base64.b64encode(out_buffer.getvalue()).decode("utf-8")

new_svg_data = svg_data.replace(b64_data, new_b64)
with open(svg_path, "w", encoding="utf-8") as f:
    f.write(new_svg_data)

print("Successfully updated AISA.svg")
