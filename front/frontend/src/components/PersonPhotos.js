import React, { useEffect, useState } from "react";
import axios from "axios";
import Lightbox from "./Lightbox";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function PersonPhotos({ personId, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [lightIndex, setLightIndex] = useState(-1);

  useEffect(()=>{ load(); }, [personId]);

  async function load(){
    try { const r = await axios.get(`${API}/api/person_dir/${personId}`); setPhotos(r.data || []); } catch(e){ setPhotos([]); }
  }

  return (
    <div className="overlay">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-panel">
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:8}}>
          <button className="btn" onClick={onClose} style={{background:"#fff", color:"#0b1220"}}>Back</button>
          <h3 style={{margin:0}}>Person {personId}</h3>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12}}>
          {photos.map((p,i)=>(
            <div key={i} style={{borderRadius:10, overflow:"hidden", cursor:"zoom-in"}} onClick={()=>setLightIndex(i)}>
              <img src={`${API}${p.url}`} alt="" style={{width:"100%", height:160, objectFit:"cover"}} />
            </div>
          ))}
        </div>
      </div>

      {lightIndex>=0 && <Lightbox images={photos.map(p=>`${API}${p.url}`)} initialIndex={lightIndex} onClose={()=>setLightIndex(-1)} />}
    </div>
  );
}
