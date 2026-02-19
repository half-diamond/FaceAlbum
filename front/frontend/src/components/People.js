import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pencil } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function People({ apiReloadKey, onOpen, searchQuery }) {
  const [people, setPeople] = useState([]);
  const [faces, setFaces] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => { load(); }, [apiReloadKey]);

  async function load() {
    try {
      const p = await axios.get(`${API}/api/people`);
      const f = await axios.get(`${API}/api/faces`);
      setPeople(p.data || []);
      setFaces(f.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function preview(pid) {
    const f = faces.find(x => x.person_id === pid);
    return f ? `${API}/api/crop/${f.crop_filename}` : null;
  }

  async function saveRename(pid) {
    if (!name.trim()) return;
    try {
      await axios.post(`${API}/api/rename_person`, {
        person_id: pid,
        name
      });
      setEditingId(null);
      load();
    } catch (err) {
      console.error("rename error:", err);
    }
  }

  const filteredPeople = searchQuery
    ? people.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : people;

  return (
    <div className="people-grid animate-people">
      {filteredPeople.map(p => (
        <div className="person-card" key={p.person_id}>
          <div className="person-avatar-wrapper">
            <div
              className="avatar avatar-hover"
              onClick={() => onOpen(p.person_id)}
            >
              {preview(p.person_id) ? (
                <img src={preview(p.person_id)} alt="" />
              ) : (
                <div className="no-preview">No preview</div>
              )}
            </div>
          </div>

          {editingId === p.person_id ? (
            <div className="rename-panel people-fade-in">
              <input
                className="rename-input-fancy"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="rename-btn-row">
                <button
                  className="rename-save-btn"
                  onClick={() => saveRename(p.person_id)}
                >
                  Save
                </button>

                <button
                  className="rename-cancel-btn"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rename-display">
              <div className="person-name">{p.name}</div>

              <button
                className="rename-btn"
                onClick={() => {
                  setEditingId(p.person_id);
                  setName(p.name);
                }}
              >
                <Pencil size={14} />
                
              </button>
            </div>
          )}

          <div className="photo-count">{p.count} photos</div>
        </div>
      ))}
    </div>
  );
}
