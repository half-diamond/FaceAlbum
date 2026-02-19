
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");


const BASE = __dirname;
const UPLOAD_DIR = path.join(BASE, "uploads");
const CROP_DIR = path.join(BASE, "crops");
const PEOPLE_DIR = path.join(BASE, "people");
const DB_FILE = path.join(BASE, "db.json");
const CLUSTER_OUT = path.join(BASE, "clusters_out.json");

[UPLOAD_DIR, CROP_DIR, PEOPLE_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});


const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { photos: [], faces: [], people: {}, person_centroids: {} });

async function loadDB() {
  await db.read();
  if (!db.data) db.data = { photos: [], faces: [], people: {}, person_centroids: {} };
}
async function saveDB() { await db.write(); }


function nextId(arr) {
  return arr?.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1;
}

function savePhotoToPerson(personId, srcFile) {
  const dir = path.join(PEOPLE_DIR, String(personId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const base = path.basename(srcFile);

  const exists = fs.readdirSync(dir).some(f => f.includes(base));
  if (exists) return;

  const dest = path.join(dir, base);
  try { fs.linkSync(srcFile, dest); }
  catch { fs.copyFileSync(srcFile, dest); }
}

// Run Python helper
function runPython(args, env = {}) {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON || "python";
    let out = "";
    let err = "";
    const p = spawn(python, args, {
      windowsHide: true,
      env: { ...process.env, ...env }
    });
    p.stdout.on("data", d => out += d.toString());
    p.stderr.on("data", d => err += d.toString());
    p.on("error", reject);
    p.on("close", code => resolve({ code, out, err }));
  });
}

function safeParseJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); }
  catch (err) { console.error("JSON parse error:", err); return null; }
}



function regeneratePersonFolders() {
  console.log("Regenerating person folders...");

  if (fs.existsSync(PEOPLE_DIR)) {
    const entries = fs.readdirSync(PEOPLE_DIR);
    for (const e of entries) {
      const full = path.join(PEOPLE_DIR, e);
      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        try { fs.rmSync(full, { recursive: true, force: true }); }
        catch (err) { console.warn("Failed to remove folder", full, err); }
      }
    }
  } else {
    fs.mkdirSync(PEOPLE_DIR, { recursive: true });
  }

  for (const face of (db.data.faces || [])) {
    const pid = face.person_id;
    if (!pid) continue;
    const photo = db.data.photos.find(p => p.id === face.photo_id);
    if (!photo) continue;
    const src = path.join(UPLOAD_DIR, photo.filename);
    if (!fs.existsSync(src)) continue;

    const personDir = path.join(PEOPLE_DIR, String(pid));
    if (!fs.existsSync(personDir)) fs.mkdirSync(personDir, { recursive: true });

    const dest = path.join(personDir, photo.filename);
    if (fs.existsSync(dest)) continue;

    try { fs.linkSync(src, dest); }
    catch { try { fs.copyFileSync(src, dest); } catch (err) { console.warn("copy failed", err); } }
  }

  console.log("Regeneration complete.");
}





const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/uploads", express.static(UPLOAD_DIR));
app.use("/api/crop", express.static(CROP_DIR));
app.use("/api/people_dir", express.static(PEOPLE_DIR));

const upload = multer({ dest: UPLOAD_DIR });


app.post("/api/upload", upload.single("file"), async (req, res) => {

  await loadDB();
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    console.log("<---------       start       --------->")

  const safeName = `${Date.now()}_${req.file.originalname}`;
  const finalPath = path.join(UPLOAD_DIR, safeName);

  try { fs.renameSync(req.file.path, finalPath); }
  catch { fs.copyFileSync(req.file.path, finalPath); try { fs.unlinkSync(req.file.path); } catch {} }

  const photoId = nextId(db.data.photos);
  const photoRec = { id: photoId, filename: safeName, uploaded_at: new Date().toISOString() };
  db.data.photos.push(photoRec);
  await saveDB();

  const modelRunner = path.join(BASE, "model_runner.py");
  if (!fs.existsSync(modelRunner)) {
    console.error("model_runner.py missing");
    return res.status(500).json({ error: "model_runner.py missing on server" });
  }

  const mr = await runPython([modelRunner, finalPath, String(photoId), CROP_DIR], { PYTHONWARNINGS: "ignore" });
  if (mr.err && mr.err.trim()) console.warn("model_runner stderr:", mr.err);

  const parsed = safeParseJson(mr.out);
  if (!parsed || !parsed.faces) {
    console.warn("No faces parsed from model_runner. Raw output:");
    console.warn(mr.out || "<no stdout>");
    return res.json({ success: true, photo: photoRec, faces_extracted: 0 });
  }

  for (const f of parsed.faces) {
    if (!f.embedding) continue;
    db.data.faces.push({
      id: nextId(db.data.faces),
      photo_id: photoId,
      person_id: 0,
      crop_filename: f.crop_filename,
      bbox: f.bbox,
      embedding: f.embedding,
      created_at: new Date().toISOString()
    });
  }

  await saveDB();

  const clusterRunner = path.join(BASE, "cluster_runner.py");
  if (!fs.existsSync(clusterRunner)) {
    console.error("cluster_runner.py missing");
    return res.status(500).json({ error: "cluster_runner.py missing on server" });
  }

  const cr = await runPython([clusterRunner, DB_FILE, CLUSTER_OUT], { PYTHONWARNINGS: "ignore" });
  if (cr.err && cr.err.trim()) console.warn("cluster_runner stderr:", cr.err);
  if (cr.out && cr.out.trim()) console.log("cluster_runner stdout:", cr.out);
  console.log(cr.out)
  if (fs.existsSync(CLUSTER_OUT)) {
    try {
      const cl = JSON.parse(fs.readFileSync(CLUSTER_OUT, "utf8"));
      const face_map = cl.face_map || {};
      const person_centroids = cl.person_centroids || {};

      for (const face of db.data.faces) {
        const mapped = face_map[String(face.id)];
        if (mapped !== undefined && mapped !== null) face.person_id = mapped;
      }

      db.data.person_centroids = person_centroids;
      regeneratePersonFolders();

      db.data.people = db.data.people || {};
      for (const pid of Object.keys(person_centroids)) {
        if (!db.data.people[pid]) db.data.people[pid] = `Person ${pid}`;
      }

      await saveDB();
    } catch (err) {
      console.error("Failed to apply cluster output:", err);
    }
  } else {
    console.warn("cluster_runner did not produce clusters_out.json");
  }
  console.log("<---------       end       --------->\n\n\n")
  return res.json({ success: true, photo: photoRec, faces_extracted: parsed.faces.length });
});




app.post("/api/recluster", async (req, res) => {
  await loadDB();
  const clusterRunner = path.join(BASE, "cluster_runner.py");
  if (!fs.existsSync(clusterRunner)) return res.status(500).json({ error: "cluster_runner.py missing" });
  try {
    const cr = await runPython([clusterRunner, DB_FILE, CLUSTER_OUT], { PYTHONWARNINGS: "ignore" });
    const out = { stdout: cr.out, stderr: cr.err, code: cr.code };
    if (fs.existsSync(CLUSTER_OUT)) {
      try { out.clusters_out = JSON.parse(fs.readFileSync(CLUSTER_OUT, "utf8")); }
      catch (e) { out.clusters_out_raw = fs.readFileSync(CLUSTER_OUT, "utf8"); }
    } else out.clusters_out = null;
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});




app.post("/api/rebuild_people_folders", async (req, res) => {
  await loadDB();
  regeneratePersonFolders();
  res.json({ success: true });
});




app.get("/api/photos", async (req, res) => {
  await loadDB();
  const sorted = [...db.data.photos].sort((a,b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
  res.json(sorted);
});

app.get("/api/faces", async (req, res) => {
  await loadDB();
  res.json(db.data.faces);
});

app.get("/api/people", async (req, res) => {
  await loadDB();
  const names = db.data.people || {};
  const map = {};
  for (const f of db.data.faces) {
    const pid = f.person_id;
    if (!map[pid]) {
      map[pid] = { person_id: pid, name: names[pid] || `Person ${pid}`, preview: f.crop_filename ? `/api/crop/${f.crop_filename}` : null, count: 0 };
    }
    map[pid].count++;
  }
  res.json(Object.values(map));
});

app.post("/api/rename_person", async (req, res) => {
  await loadDB();
  const { person_id, name } = req.body;
  if (!person_id) return res.status(400).json({ error: "Missing person_id" });
  db.data.people[person_id] = name || `Person ${person_id}`;
  await saveDB();

  regeneratePersonFolders();
  res.json({ success: true });
});

app.get("/api/person_dir/:pid", async (req, res) => {
  const pid = req.params.pid;
  const dir = path.join(PEOPLE_DIR, pid);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).map(f => ({ url: `/api/people_dir/${pid}/${encodeURIComponent(f)}`, filename: f }));
  res.json(files);
});

app.get("/api/people/search", async (req, res) => {
  await loadDB();
  const q = (req.query.s || "").toLowerCase();
  const names = db.data.people || {};
  const people = {};
  for (const f of db.data.faces) {
    const pid = f.person_id;
    if (!people[pid]) {
      people[pid] = { person_id: pid, name: names[pid] || `Person ${pid}`, preview: `/api/crop/${f.crop_filename}`, count: 0 };
    }
    people[pid].count++;
  }
  const result = Object.values(people).filter(p => p.name.toLowerCase().includes(q) || String(p.person_id).includes(q));
  res.json(result);
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Backend running on", PORT));
