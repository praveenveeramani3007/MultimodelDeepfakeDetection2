from analysis_logic import analyze_image_native
from PIL import Image, ImageDraw
import io

print("Creating dummy image...")
img = Image.new('RGB', (500, 500), color = 'white')
d = ImageDraw.Draw(img)
d.rectangle([100, 100, 400, 400], fill='gray', outline='black')

# Save to bytes
buf = io.BytesIO()
img.save(buf, format='JPEG')
img_bytes = buf.getvalue()

print("Running analysis...")
result = analyze_image_native(img_bytes)

print("\n--- RESULTS ---")
print("Authenticity Label:", result.get("authenticity_label"))
print("Details:", result.get("details"))

if "hair_detail" in result.get("details", {}):
    print("SUCCESS: Found detail fields in result.")
else:
    print("FAIL: Did not find detail fields.")
