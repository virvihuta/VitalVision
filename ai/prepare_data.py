import pandas as pd
import os
import shutil
from pathlib import Path

df = pd.read_csv('data/selected_images.csv')

os.makedirs('data/images/normal', exist_ok=True)
os.makedirs('data/images/anomaly', exist_ok=True)

RAW_DIR = 'data/raw'
image_dirs = [f for f in os.listdir(RAW_DIR) if f.startswith('images_')]

def find_image(filename):
    for folder in image_dirs:
        path = Path(RAW_DIR) / folder / 'images' / filename
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
        dst = Path(f'data/images/{label}') / filename
        shutil.copy2(src, dst)
        found += 1
    else:
        not_found += 1
    
    if found % 100 == 0:
        print(f"Copied {found} images...")

print(f"\nDone. Found: {found}, Not found: {not_found}")