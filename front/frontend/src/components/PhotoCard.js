import React from "react";

export default function PhotoCard({ photo, apiBase }) {
  const url = `${apiBase}/api/uploads/${encodeURIComponent(photo.filename)}`;
  return (
    <div className="card" role="article" aria-label={photo.filename}>
      <img src={url} alt={photo.filename} draggable={false} />
    </div>
  );
}
