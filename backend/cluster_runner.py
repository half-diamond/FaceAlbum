import sys
import json
import hdbscan
import numpy as np
from sklearn.preprocessing import normalize



def load_db(db_path):
    with open(db_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_output(out_path, data):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f)

def main():
    if len(sys.argv) < 3:
        print("Missing arguments", flush=True)
        return

    db_path = sys.argv[1]
    out_path = sys.argv[2]

    db = load_db(db_path)
    faces = db.get("faces", [])

    X = []
    face_ids = []

    for f in faces:
        emb = f.get("embedding")
        pid = f.get("person_id")
        fid = f.get("id")

        if emb is not None and fid is not None:
            X.append(emb)
            face_ids.append(fid)

    if not X:
        save_output(out_path, {"face_map": {}, "person_centroids": {}})
        return


    X = normalize(np.array(X, dtype="float32"), norm="l2")

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=2,
        min_samples=1,
        metric='euclidean',   
        cluster_selection_epsilon=0.05,  
        cluster_selection_method='leaf'
    )



   
    labels = clusterer.fit_predict(X)

    unique_labs = sorted(set(labels))
    cluster_to_pid = {}

    next_pid = 1
    for lab in unique_labs:
        cluster_to_pid[lab] = next_pid
        next_pid += 1

    face_map = {}
    for i, fid in enumerate(face_ids):
        lab = labels[i]
        face_map[str(fid)] = int(cluster_to_pid[lab])



    person_centroids = { str(pid): {} for pid in cluster_to_pid.values() }



    output = {
        "face_map": face_map,
        "person_centroids": person_centroids
    }

    save_output(out_path, output)
    print(labels, flush=True)


if __name__ == "__main__":
    main()
