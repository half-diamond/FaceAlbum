import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Gallery from "./components/Gallery";
import People from "./components/People";
import PersonPhotos from "./components/PersonPhotos";
import UploadFAB from "./components/UploadFAB";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("photos");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");

  function toggleTheme() {
    const t = theme === "light" ? "dark" : "light";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
  }

  function onUploaded() {
    setReloadKey(k => k + 1);
  }

  function handleSearch(query) {
    setSearchQuery(query);
    setSelectedPerson(null);
    setTab("photos");
  }


  useEffect(() => {
    const content = document.querySelector(".content-area");
    const topbar = document.querySelector(".topbar");

    function onScroll() {
      if (content.scrollTop > 18) {topbar.classList.add("is-sticky");content.classList.add("stick")}
      else {topbar.classList.remove("is-sticky");content.classList.remove("stick")};
    }

    content.addEventListener("scroll", onScroll);
    return () => content.removeEventListener("scroll", onScroll);
  }, []);




  return (
    <div className="app-shell">
      <Sidebar active={tab} onChange={setTab} />

      <div className="content-area">
        <Topbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onSearch={handleSearch}
          onSelectPerson={(id) => {
            setSelectedPerson(id);
            setTab("people");
          }}
        />


        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div className="panel">

            {tab === "photos" && (
              <Gallery reloadKey={reloadKey} searchQuery={searchQuery} />
            )}

            {tab === "people" && !selectedPerson && (
              <People apiReloadKey={reloadKey} onOpen={setSelectedPerson} searchQuery={searchQuery} />

            )}

            {selectedPerson && (
              <PersonPhotos
                personId={selectedPerson}
                onClose={() => setSelectedPerson(null)}
              />
            )}

          </div>
        </div>
      </div>

      <UploadFAB onUploaded={onUploaded} />
    </div>
  );
}
