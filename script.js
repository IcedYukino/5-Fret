let songs = [];
let currentTab = "all";
let sortDirection = 1;

// Load songs and initialize everything
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupSongGridClicks();
  setupOverlayClose();
  setupSearch();
  setupSortButtons();
  setupTabs();
  setupRandomSong();
});

// Event delegation for song card clicks (dropdown + more info)
function setupSongGridClicks() {
  const grid = document.getElementById("song-grid");
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".song");
    if (!card) return;

    const dropdown = card.querySelector(".difficulty-dropdown");

    // More Info button
    if (e.target.classList.contains("more-info-btn")) {
      const title = card.dataset.title;
      const song = songs.find(s => s.title === title);
      if (song) openSongInfo(song);
      return;
    }

    // Toggle dropdown (not on More Info or download links)
    if (dropdown && !e.target.closest(".song-download") && !e.target.classList.contains("more-info-btn")) {
      const isOpen = dropdown.classList.contains("open");
      document.querySelectorAll(".difficulty-dropdown.open").forEach(d => d.classList.remove("open"));
      if (!isOpen) dropdown.classList.add("open");
    }
  });
}

// Load songs JSON
async function loadSongs(tab) {
  let files = [];
  if (tab === "all") {
    try {
      const res = await fetch("./songlists/index.json");
      files = await res.json();
    } catch (err) { console.error(err); return; }
  } else {
    files = [tab];
  }

  let loadedSongs = [];
  for (const file of files) {
    try {
      const res = await fetch(`./songlists/${file}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      loadedSongs.push(...data);
    } catch { continue; }
  }

  songs = loadedSongs.sort((a, b) => a.title.localeCompare(b.title));
  displaySongs(songs);
  document.getElementById("song-count").innerText = songs.length + " songs";
}

// Display songs
function displaySongs(list) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  list.forEach(song => {
    const ratingClass = song.rating || "NR";
    const genreClass = (song.genre || "").toLowerCase().replace(/[^a-z]/g, "");
    const coverTag = song.master === false ? `<div class="cover-tag">COVER</div>` : "";
    const cover = song.cover || "./assets/default_cover.png";

    const card = document.createElement("div");
    card.className = `song ${song.category || ""}`;
    card.dataset.title = song.title;

    card.innerHTML = `
      <div class="cover-container">
        <img src="${cover}">${coverTag}
      </div>
      <h3><a class="song-download" ${song.file ? `href="${song.file}" download` : "disabled"}>${song.title}</a></h3>
      <p>${song.artist || ""}</p>
      <div class="genre-row">
        <span class="genre-tag ${genreClass}">${song.genre || ""}</span>
        <span class="song-rating ${ratingClass}">${song.rating || "NR"}</span>
      </div>
      <div class="difficulty-dropdown">
        ${["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].map(inst => `
          <div class="instrument">
            <img class="instrument-icon" src="./assets/${inst}.png">
            ${createDifficulty(song.difficulty?.[inst])}
          </div>
        `).join("")}
        <button class="more-info-btn">More Info</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Difficulty bars
function createDifficulty(level) {
  if (level == null || level === -1) return `<div class="no-part">NO PART</div>`;
  let bars = "";
  for (let i = 1; i <= 5; i++) {
    if (level === 6) bars += `<div class="diff red"></div>`;
    else if (i <= level) bars += `<div class="diff filled"></div>`;
    else bars += `<div class="diff"></div>`;
  }
  return `<div class="diff-row">${bars}</div>`;
}

// Open overlay
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  overlay.classList.add("open");

  document.getElementById("info-cover").src = song.cover || "./assets/default_cover.png";
  document.querySelector(".overlay-bg").style.backgroundImage = `url(${song.cover || "./assets/default_cover.png"})`;
  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year || "";
  document.getElementById("info-release").innerText = formatDate(song.release);
  document.getElementById("info-charter").innerHTML = song.category ? `<span class="harmonix-charter">Harmonix</span>` : "";
  document.getElementById("info-genre").innerText = song.genre || "";

  // Song rating colored text
  const ratingEl = document.getElementById("info-rating");
  let ratingText = "Not Rated", ratingClass = "NR";
  if (song.rating === "FF") { ratingText = "Family Friendly"; ratingClass="FF"; }
  else if (song.rating === "SR") { ratingText="Supervision Recommended"; ratingClass="SR"; }
  ratingEl.innerText = ratingText;
  ratingEl.className = "info-value " + ratingClass;

  // Source text + icon
  const sourceTextEl = document.getElementById("info-source-text");
  const sourceIconEl = document.getElementById("info-source-icon");
  const sourceMap = {
    rb1: "Rock Band",
    rb1dlc: "Rock Band DLC",
    rb2: "Rock Band 2",
    rb2dlc: "Rock Band 2 DLC",
    rb3: "Rock Band 3",
    rb3dlc: "Rock Band 3 DLC",
    rb4: "Rock Band 4",
    rb4dlc: "Rock Band 4 DLC",
    rb4rivals: "Rock Band Rivals"
  };
  sourceTextEl.innerText = sourceMap[song.category] || "";
  sourceIconEl.src = song.category ? `assets/${song.category}.png` : "";

  // Populate difficulties in overlay
  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].forEach(inst => {
    const el = document.getElementById(`info-${inst}`);
    if (el) el.innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // Vocals icon
  const vocalsIcon = document.getElementById("info-vocals-icon");
  if (vocalsIcon) {
    let harm = song.Harm || song.harm || 1;
    vocalsIcon.src = `assets/vocals${harm > 1 ? harm : ""}.png`;
  }
}

// Format release date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US",{ month:"long", day:"numeric", year:"numeric" });
}

// Close overlay
function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");
  document.getElementById("closeOverlay").addEventListener("click", ()=>overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if(e.target===overlay) overlay.classList.remove("open"); });
  document.addEventListener("keydown", e => { if(e.key==="Escape") overlay.classList.remove("open"); });
}

// Search input
function setupSearch() {
  const input = document.getElementById("search");
  input.addEventListener("keyup", () => {
    const val = input.value.toLowerCase();
    const filtered = songs.filter(s => (s.title||"").toLowerCase().includes(val) || (s.artist||"").toLowerCase().includes(val));
    displaySongs(filtered);
    document.getElementById("song-count").innerText = filtered.length + " songs";
  });
}

// Sort buttons
function setupSortButtons() {
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", () => {
      songs.sort((a,b)=>{
        const A = (a[btn.dataset.sort]||"").toLowerCase();
        const B = (b[btn.dataset.sort]||"").toLowerCase();
        if(A<B) return -1*sortDirection;
        if(A>B) return 1*sortDirection;
        return 0;
      });
      sortDirection*=-1;
      displaySongs(songs);
    });
  });
}

// Tabs
function setupTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      currentTab = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");
      sortDirection=1;
      await loadSongs(currentTab);
    });
  });
}

// Random Song
function setupRandomSong() {
  const btn = document.getElementById("randomSong");
  btn.addEventListener("click", ()=>{
    if(songs.length===0) return;
    const rand = songs[Math.floor(Math.random()*songs.length)];
    displaySongs(songs);
    setTimeout(()=>{
      const card = [...document.querySelectorAll(".song")].find(c=>c.dataset.title===rand.title);
      if(card){
        card.scrollIntoView({behavior:"smooth",block:"center"});
        card.style.boxShadow="0 0 25px #0aa3ff";
        card.querySelector(".difficulty-dropdown")?.classList.add("open");
      }
    },100);
  });
}
