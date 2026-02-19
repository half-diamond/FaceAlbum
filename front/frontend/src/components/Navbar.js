import React, { useState } from "react";
import axios from "axios";
import { UploadCloud } from "lucide-react";
import "./Navbar.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Navbar({ onUploaded }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function upload(e) {
    e.preventDefault();
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    files.forEach(f => fd.append("file", f));

    try {
      await axios.post(`${API}/api/upload`, fd, {
        onUploadProgress: (ev) => {
          if (ev.total) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        }
      });
      onUploaded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setFiles([]);
    }
  }

  return (
    <header className="upload-bar">

      <form onSubmit={upload} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        
        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles([...e.target.files])}
            style={{ display: "none" }}
          />
          <UploadCloud size={18} />
          Select images
        </label>

        <button
          className="fab"
          type="submit"
          disabled={uploading || !files.length}
          style={{ width: "auto", padding: "6px 12px", borderRadius: 10 }}
        >
          {uploading ? `Uploading ${progress}%` : "Upload"}
        </button>
      </form>
    </header>
  );
}
