let songs = [];
let currentTab = "all";
let sortDirection = 1;

// ==========================
// DOMContentLoaded
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
  setupRandomButton();
  setupSongClickHandler();
});

// ==========================
// Song Click Handler
// ==========================
function setupSongClickHandler() {
  const grid = document.getElementById("song-grid");

  grid.addEventListener("click", function (e) {
    const target = e.target;
    const songCard = target.closest(".song");
    if (!songCard) return;

    const dropdown = songCard.querySelector(".difficulty-dropdown");

    // More Info button inside dropdown
    if (target.classList.contains("more-info-btn")) {
      const title = songCard.dataset.title;
      const song = songs.find(s => s.title === title);
      if (song) openSongInfo(song);
      return;
    }

    // Toggle dropdown
    if (dropdown && !target.classList.contains("song-download")) {
      const isOpen = dropdown.classList.contains("open");
      document.querySelectorAll(".difficulty-dropdown.open").forEach(d => d.classList.remove("open"));
      if (!isOpen) dropdown.classList.add("open");
    }
  });
}

// ==========================
// Load Songs
// ==========================
async function loadSongs(tab) {
  let files = [];

  if (tab === "all") {
    try {
      const index = await fetch("./songlists/index.json");
      files = await index.json();
    } catch (err) {
      console.error("Failed to load index.json", err);
      return;
    }
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
    } catch (err) {
      console.warn(`Error loading ${file}.json`, err);
    }
  }

  songs = loadedSongs.sort((a, b) => a.title.localeCompare(b.title));
  displaySongs(songs);

  const counter = document.getElementById("song-count");
  if (counter) counter.innerText = songs.length + " songs";
}

// ==========================
// Display Songs
// ==========================
function displaySongs(songList) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  songList.forEach(song => {
    const card = document.createElement("div");
    card.className = `song ${song.category || ""} ${song.gold ? "gold" : ""}`;
    card.dataset.title = song.title;

    const rating = song.rating || "NR";
    const coverTag = song.master === false ? `<div class="cover-tag">COVER</div>` : "";
    const cover = song.cover || "./assets/default_cover.png";
    const file = song.file || "";
    const difficulty = song.difficulty || {};

    card.innerHTML = `
      <div class="cover-container">
        <img src="${cover}">${coverTag}
      </div>
      <h3><a class="song-download" ${file ? `href="${file}" download` : "disabled"}>${song.title}</a></h3>
      <p>${song.artist || ""}</p>
      <div class="genre-row">
        <span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g, "") || ""}">${song.genre || ""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>

      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst => `
          <div class="instrument">
            <img class="instrument-icon" src="${getInstrumentIcon(inst,song)}">
            ${createDifficulty(difficulty[inst])}
          </div>
        `).join("")}
        <button class="more-info-btn">More Info</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ==========================
// Difficulty
// ==========================
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

// ==========================
// Instrument icons
// ==========================
function getInstrumentIcon(inst, song) {
  if (inst === "vocals") {
    let harm = song.Harm || song.harm || 1;
    return `./assets/vocals${harm > 1 ? harm : ""}.png`;
  }
  return `./assets/${inst}.png`;
}

// ==========================
// Open Song Info Overlay
// ==========================
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  document.getElementById("info-cover").src = song.cover || "./assets/default_cover.png";
  const bg = document.querySelector(".overlay-bg");
  if (bg) bg.style.backgroundImage = `url(${song.cover || "./assets/default_cover.png"})`;

  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year || "";

  // Charter always Harmonix if source exists
  document.getElementById("info-charter").innerText = song.category ? "Harmonix" : "";

  // Difficulty
  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].forEach(inst => {
    const elem = document.getElementById(`info-${inst}`);
    if (elem) elem.innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // Vocals icon
  const vocalsIcon = document.getElementById("info-vocals-icon");
  if (vocalsIcon) {
    let harm = song.Harm || song.harm || 1;
    vocalsIcon.src = `assets/vocals${harm > 1 ? harm : ""}.png`;
  }

  // Genre
  document.getElementById("info-genre").innerText = song.genre || "";

  // Source full text
  let sourceText = "";
  switch (song.category) {
    case "rb1": sourceText = "Rock Band"; break;
    case "rb1dlc": sourceText = "Rock Band DLC"; break;
    case "rb2": sourceText = "Rock Band 2"; break;
    case "rb2dlc": sourceText = "Rock Band 2 DLC"; break;
    case "tbrb": sourceText = "The Beatles Rock Band"; break;
    case "tbrbdlc": sourceText = "The Beatles Rock Band DLC"; break;
    case "lrb": sourceText = "Lego Rock Band"; break;
    case "gdrb": sourceText = "Green Day Rock Band"; break;
    case "rb3": sourceText = "Rock Band 3"; break;
    case "rb3dlc": sourceText = "Rock Band 3 DLC"; break;
    case "rb_blitz": sourceText = "Rock Band Blitz"; break;
    case "rb4": sourceText = "Rock Band 4"; break;
    case "rb4dlc": sourceText = "Rock Band 4 DLC"; break;
    case "rb4rivals": sourceText = "Rock Band 4 Rivals"; break;
    default: sourceText = song.category || "";
  }
  document.getElementById("info-source-text").innerText = sourceText;

  // Song rating
  let ratingText = "Not Rated";
  let ratingClass = "NR";
  if (song.rating === "FF") { ratingText = "Family Friendly"; ratingClass="FF"; }
  else if (song.rating === "SR") { ratingText = "Supervision Recommended"; ratingClass="SR"; }
  const ratingEl = document.getElementById("info-rating");
  ratingEl.innerText = ratingText;
  ratingEl.className = "info-value " + ratingClass;

  // Release formatting
  if(song.release){
    const d = new Date(song.release);
    const options = { year:"numeric", month:"long", day:"numeric" };
    document.getElementById("info-release").innerText = d.toLocaleDateString(undefined, options);
  } else document.getElementById("info-release").innerText = "";

  overlay.classList.add("open");
}

// ==========================
// Close Overlay
// ==========================
function closeSongInfo() {
  document.getElementById("song-info-overlay").classList.remove("open");
}

// ==========================
// Overlay close logic
// ==========================
function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSongInfo(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSongInfo(); });
}

// ==========================
// Search Songs
// ==========================
function searchSongs() {
  const input = document.getElementById("search").value.toLowerCase();
  const filtered = songs.filter(song =>
    (song.title || "").toLowerCase().includes(input) ||
    (song.artist || "").toLowerCase().includes(input)
  );
  displaySongs(filtered);
  document.getElementById("song-count").innerText = filtered.length + " songs";
}

// ==========================
// Sort Songs
// ==========================
function sortSongs(type) {
  songs.sort((a,b) => {
    const A = (a[type] || "").toLowerCase();
    const B = (b[type] || "").toLowerCase();
    if(A<B) return -1*sortDirection;
    if(A>B) return 1*sortDirection;
    return 0;
  });
  displaySongs(songs);
  sortDirection*=-1;
}

// ==========================
// Switch Tabs
// ==========================
async function switchTab(tab, button){
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(btn=>btn.classList.remove("active"));
  button.classList.add("active");
  sortDirection=1;
  await loadSongs(tab);
}

// ==========================
// Random Song
// ==========================
function setupRandomButton(){
  const randomBtn = document.getElementById("randomSong");
  if(!randomBtn) return;
  randomBtn.addEventListener("click", () => {
    if(songs.length===0) return;
    const random = songs[Math.floor(Math.random()*songs.length)];
    displaySongs(songs);

    setTimeout(()=>{
      const cards = document.querySelectorAll(".song");
      for(const card of cards){
        if(card.querySelector("h3")?.innerText === random.title){
          card.scrollIntoView({behavior:"smooth", block:"center"});
          card.style.boxShadow="0 0 25px #0aa3ff";
          const dropdown = card.querySelector(".difficulty-dropdown");
          if(dropdown) dropdown.classList.add("open");
          break;
        }
      }
    },50);
  });
}
