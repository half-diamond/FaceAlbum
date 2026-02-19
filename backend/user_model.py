import os
import cv2
import numpy as np

os.environ["INSIGHTFACE_LOG_LEVEL"] = "ERROR"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

import warnings
warnings.filterwarnings("ignore")

import sys
import contextlib

from insightface.app import FaceAnalysis

@contextlib.contextmanager
def silent():
    saved_stdout = sys.stdout
    saved_stderr = sys.stderr
    try:
        sys.stdout = open(os.devnull, "w")
        sys.stderr = open(os.devnull, "w")
        yield
    finally:
        sys.stdout.close()
        sys.stderr.close()
        sys.stdout = saved_stdout
        sys.stderr = saved_stderr

with silent():
    app = FaceAnalysis(name="buffalo_l")
    try:
        app.prepare(ctx_id=0, det_size=(640, 640))   # GPU
    except Exception:
        app.prepare(ctx_id=-1, det_size=(640, 640))  # CPU 


def _to_int_bbox(b):
    # accept numpy array or list-like
    try:
        arr = [int(x) for x in b]
        return arr
    except Exception:
        return None

def detect_and_embed(image_path: str, out_dir: str):
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)
    os.makedirs(out_dir, exist_ok=True)

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Cannot read image: " + image_path)

    faces = app.get(img, max_num=0)

    result = []
    h, w = img.shape[:2]
    for i, f in enumerate(faces):
        try:
            bbox = f.bbox.astype(int)
        except Exception:
            bbox = _to_int_bbox(f.bbox)
            if bbox is None:
                continue

        x1, y1, x2, y2 = bbox
        pad = int(0.08 * (x2 - x1))  # 8% 
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w - 1, x2 + pad)
        y2 = min(h - 1, y2 + pad)

        crop = img[y1:y2, x1:x2]
        if crop is None or crop.size == 0:
            continue

        crop_filename = f"face_{os.path.splitext(os.path.basename(image_path))[0]}_{i}.jpg"
        crop_path = os.path.join(out_dir, crop_filename)
        cv2.imwrite(crop_path, crop)

        emb = None
        if hasattr(f, "embedding") and f.embedding is not None:
            try:
                emb = f.embedding.astype(float).tolist()
            except Exception:
                try:
                    emb = [float(x) for x in f.embedding]
                except Exception:
                    emb = None

        result.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "crop_filename": crop_filename,
            "embedding": emb
        })

    return result
