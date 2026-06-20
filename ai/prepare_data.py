import os
import shutil
from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / 'data'
RAW_DIR = DATA_DIR / 'raw'
IMAGES_DIR = DATA_DIR / 'images'

df = pd.read_csv(DATA_DIR / 'selected_images.csv')

os.makedirs(IMAGES_DIR / 'normal', exist_ok=True)
os.makedirs(IMAGES_DIR / 'anomaly', exist_ok=True)

image_dirs = [f for f in os.listdir(RAW_DIR) if f.startswith('images_')]

def find_image(filename):
    for folder in image_dirs:
        path = RAW_DIR / folder / 'images' / filename
        if path.exists():
            return path
    return None

found = 0
not_found = 0

for _, row in df.iterrows():
    filename = row['Image Index']
    label = row['binary_label']
    src = find_image(filename)

    if src:
        dst = IMAGES_DIR / label / filename
        shutil.copy2(src, dst)
        found += 1
        if found % 100 == 0:
            print(f"Copied {found} images...")
    else:
        not_found += 1

print(f"\nDone. Found: {found}, Not found: {not_found}")