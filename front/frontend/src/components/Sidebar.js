import React from "react";
import { Image, Clock, Grid, User, Star } from "lucide-react";

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="logo">FaceAlbum</div>
      <nav className="nav">

        <button
          className={`nav-btn ${active==="photos" ? "active" : ""}`}
          onClick={() => onChange("photos")}
        >
          <Image size={16}/> Photos
        </button>

        <button
          className={`nav-btn ${active==="recent" ? "active" : ""}`}
          onClick={() => onChange("recent")}
        >
          <Clock size={16}/> Recent
        </button>

        <button
          className={`nav-btn ${active==="albums" ? "active" : ""}`}
          onClick={() => onChange("albums")}
        >
          <Grid size={16}/> Albums
        </button>

        <button
          className={`nav-btn ${active==="people" ? "active" : ""}`}
          onClick={() => onChange("people")}
        >
          <User size={16}/> People
        </button>

        <button
          className={`nav-btn ${active==="favs" ? "active" : ""}`}
          onClick={() => onChange("favs")}
        >
          <Star size={16}/> Favourites
        </button>

      </nav>
    </aside>
  );
}
