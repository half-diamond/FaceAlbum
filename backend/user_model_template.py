# user_model_template.py
# Simple placeholder: returns the full image as one face with a random embedding.
from PIL import Image
import numpy as np
import os

def detect_and_embed(image_path: str, out_dir: str):
    im = Image.open(image_path).convert('RGB')
    w, h = im.size
    out_name = f"crop_{os.path.basename(image_path)}"
    out_path = os.path.join(out_dir, out_name)
    im.resize((160,160)).save(out_path)
    emb_len = 512
    emb = (np.random.rand(emb_len) * 2 - 1).tolist()
    return [{
        'bbox': [0, 0, w, h],
        'crop_filename': out_name,
        'embedding': emb
    }]
