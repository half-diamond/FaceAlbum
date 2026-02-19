import React, { useRef } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function UploadFAB({ onUploaded }) {
  const ref = useRef(null);

  async function handle(e){
    const files = e.target.files;
    if(!files) return;
    for(let f of files){
      const fd = new FormData();
      fd.append("file", f);
      try { await axios.post(`${API}/api/upload`, fd); } catch(e){ console.error(e); }
    }
    onUploaded?.();
  }

  return (
    <>
      <input ref={ref} type="file" multiple accept="image/*" style={{display:"none"}} onChange={handle} />
      <div className="fab" onClick={()=>ref.current?.click()}>+</div>
    </>
  );
}
