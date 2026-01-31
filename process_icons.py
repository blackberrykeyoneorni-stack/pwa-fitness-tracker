
from PIL import Image
import os

source_path = "/home/marco/.gemini/antigravity/brain/8f17fe4e-51dd-439a-9a18-5eae5d2b492f/dumbbell_icon_1769863283824.png"
dest_dir = "/home/marco/pwa-fitness-tracker/public"
sizes = [192, 512]

try:
    with Image.open(source_path) as img:
        # Convert to RGBA to ensure transparency handling if needed, though MD3 usually opaque background
        img = img.convert("RGBA")
        
        for size in sizes:
            # High quality resize
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = os.path.join(dest_dir, f"pwa-{size}x{size}.png")
            resized_img.save(output_path, "PNG")
            print(f"Successfully saved {output_path}")

except Exception as e:
    print(f"Error processing images: {e}")
