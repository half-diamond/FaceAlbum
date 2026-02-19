import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search, Sun, Moon } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Topbar({ theme, onThemeToggle, onSearch, onSelectPerson }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        // Fetch people + photos
        const peopleRes = await axios.get(`${API}/api/people`);
        const photosRes = await axios.get(`${API}/api/photos`);

        const pList = peopleRes.data || [];
        const photoList = photosRes.data || [];

        const qLower = q.toLowerCase();

        // Filter People
        const peopleMatches = pList
          .filter(p => p.name.toLowerCase().includes(qLower))
          .map(p => ({ type: "person", data: p }));

        // Filter Photos (filename)
        const photoMatches = photoList
          .filter(p => p.filename.toLowerCase().includes(qLower))
          .slice(0, 6)
          .map(p => ({ type: "photo", data: p }));

        const combined = [...peopleMatches, ...photoMatches];

        setSuggestions(combined);
        setOpen(true);

      } catch (err) {
        console.error(err);
      }
    }, 150);

  }, [q]);

  function handleSelect(item) {
    if (item.type === "person") {
      onSelectPerson(item.data.person_id);
    } else if (item.type === "photo") {
      onSearch(item.data.filename);
    }
    setOpen(false);
  }

  function submit() {
    setOpen(false);
    onSearch(q);
  }

  return (
    <div className="topbar" >
      <div className="topbar-title">FaceAlbum</div>

      <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center" }}>
        {/* SEARCH BAR */}
        <div className="search">
          <Search size={16} onClick={submit} style={{ cursor: "pointer" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search"
          />
        </div>

        {/* SEARCH SUGGESTIONS */}
        {open && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "58px",
              width: "480px",
              background: "var(--panel)",
              borderRadius: "16px",
              padding: "10px 0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              border: "1px solid var(--border)",
              zIndex: 999999,
            }}
          >
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onMouseDown={() => handleSelect(item)}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                {item.type === "person" ? (
                  <>
                    <div style={{ fontWeight: 600 }}>{item.data.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      ({item.data.count} photos)
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 500 }}>{item.data.filename}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THEME */}
      <button className="theme-btn" onClick={onThemeToggle}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
