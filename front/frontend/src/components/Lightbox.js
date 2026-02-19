import React, { useState, useEffect } from "react";

export default function Lightbox({ images=[], initialIndex=0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(()=>{
    function onKey(e){ if(e.key==='Escape') onClose(); if(e.key==='ArrowRight') setIndex(i=>Math.min(i+1, images.length-1)); if(e.key==='ArrowLeft') setIndex(i=>Math.max(i-1,0)); }
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[images.length, onClose]);

  if(!images.length) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay-backdrop" />
      <div className="overlay-panel" onClick={e=>e.stopPropagation()}>
        <div className="lightbox">
          <button onClick={()=>setIndex(i=>Math.max(i-1,0))} style={{marginRight:8}}>‹</button>
          <img src={images[index]} alt="" />
          <button onClick={()=>setIndex(i=>Math.min(i+1, images.length-1))} style={{marginLeft:8}}>›</button>
        </div>
      </div>
    </div>
  );
}
