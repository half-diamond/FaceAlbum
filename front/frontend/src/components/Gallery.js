import React, { useEffect, useState } from "react";
import axios from "axios";
import PhotoCard from "./PhotoCard";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Gallery({ reloadKey, searchQuery }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [reloadKey, searchQuery]);

  async function load() {
    setLoading(true);

    try {
      const res = await axios.get(`${API}/api/photos`);
      let data = res.data || [];

      // 🔍 Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        data = data.filter(p => p.filename.toLowerCase().includes(q));
      }

      setPhotos(data);
    } catch (e) {
      console.error("Photo load error:", e);
      setPhotos([]);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="gallery-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card" style={{ height: 220 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {photos.map((p) => (
        <PhotoCard key={p.id} photo={p} apiBase={API} />
      ))}
    </div>
  );
}
