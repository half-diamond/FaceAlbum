
import sys
import os
import json
import importlib.util
import traceback
import warnings

warnings.filterwarnings("ignore")

def load_user_module(user_py):
    spec = importlib.util.spec_from_file_location("user_model", user_py)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def safe_print_json(obj):
    try:
        print(json.dumps(obj, ensure_ascii=False))
    except Exception:
        print(json.dumps({"error": "failed to serialize output"}))

def main():
    if len(sys.argv) < 4:
        safe_print_json({"error": "usage: model_runner.py IMAGE_PATH PHOTO_ID OUTPUT_FACE_DIR"})
        sys.exit(1)

    image_path = sys.argv[1]
    photo_id = sys.argv[2]
    faces_dir = sys.argv[3]

    os.makedirs(faces_dir, exist_ok=True)

    base_dir = os.path.dirname(__file__)
    user_py = os.path.join(base_dir, "user_model.py")

    if not os.path.exists(user_py):
        safe_print_json({"error": "user_model.py is missing"})
        sys.exit(2)

    try:
        user_mod = load_user_module(user_py)
    except Exception:
        tb = traceback.format_exc()
        safe_print_json({"error": "Failed importing user_model", "trace": tb})
        sys.exit(3)

    if not hasattr(user_mod, "detect_and_embed"):
        safe_print_json({"error": "user_model.py must define detect_and_embed(image_path, out_dir)"})
        sys.exit(4)

    try:
        faces = user_mod.detect_and_embed(image_path, faces_dir)

        out_faces = []
        for f in faces:
            if not isinstance(f, dict):
                continue
            emb = f.get("embedding", None)
            if emb is not None:
                try:
                    emb = [float(x) for x in emb]
                except Exception:
                    emb = None
            crop = f.get("crop_filename", None)
            bbox = f.get("bbox", None)
            out_faces.append({
                "bbox": bbox if bbox is not None else None,
                "crop_filename": crop if crop is not None else None,
                "embedding": emb
            })

        safe_print_json({"faces": out_faces})
    except Exception:
        tb = traceback.format_exc()
        safe_print_json({"error": "model execution failed", "trace": tb})
        sys.exit(5)

if __name__ == "__main__":
    main()
