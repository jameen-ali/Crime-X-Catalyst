import os
from PIL import Image

def compress_images():
    src_dir = r"d:\COLLEGE\HACKATHON\Prototype\Crime-X-main\frontend\public\dataset"
    if not os.path.exists(src_dir):
        print("Source directory does not exist:", src_dir)
        return

    files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Found {len(files)} files to compress.")

    for i, file in enumerate(files):
        path = os.path.join(src_dir, file)
        try:
            with Image.open(path) as img:
                img.thumbnail((150, 150))
                img.save(path, format="PNG", optimize=True)
            if (i + 1) % 20 == 0 or i == len(files) - 1:
                print(f"Compressed {i + 1}/{len(files)} files...")
        except Exception as e:
            print(f"Error compressing {file}: {e}")

if __name__ == "__main__":
    compress_images()
