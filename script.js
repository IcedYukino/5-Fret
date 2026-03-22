let songs = [];
let currentTab = "all";
let sortDirection = 1;

window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
  setupGoldToggle();
  setupRandomButton();
  setupSongClickHandler();
});

// -------------------------
// Song Click Handler
// -------------------------
function setupSongClickHandler() {
  const grid = document.getElementById("song-grid");
  grid.addEventListener("click", function(e) {
    const target = e.target;
    const songCard = target.closest(".song");
    if (!songCard) return;

    const dropdown = songCard.querySelector(".difficulty-dropdown");

    if (target.classList.contains("more-info-btn")) {
      const title = songCard.querySelector("h3")?.innerText;
      const song = songs.find(s => s.title === title);
      if (song) openSongInfo(song);
    } else if (!target.classList.contains("song-download")) {
      const isOpen = dropdown.classList.contains("open");
      document.querySelectorAll(".difficulty-dropdown.open").forEach(d => d.classList.remove("open"));
      if (!isOpen) dropdown.classList.add("open");
    }
  });
}

// -------------------------
// Load Songs
// -------------------------
async function loadSongs(tab) {
  let files = [];
  if (tab === "all") {
    try {
      const index = await fetch("./songlists/index.json");
      files = await index.json();
    } catch (err) { console.error("Failed to load index.json", err); return; }
  } else {
    files = [tab]; // simplified for other tabs
  }

  let loadedSongs = [];
  for (const file of files) {
    try {
      const res = await fetch(`./songlists/${file}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      loadedSongs.push(...data);
    } catch (err) { console.warn(`Error loading ${file}.json`, err); }
  }

  songs = loadedSongs.sort((a,b) => a.title.localeCompare(b.title));
  displaySongs(songs);

  const counter = document.getElementById("song-count");
  if (counter) counter.innerText = songs.length + " songs";
}

// -------------------------
// Instrument icon (vocals dynamic)
// -------------------------
function getInstrumentIcon(inst, song) {
  if (inst === "vocals") {
    let harm = song.Harm || song.harm || 1;
    return `./assets/vocals${harm > 1 ? harm : ""}.png`;
  }
  return `./assets/${inst}.png`;
}

// -------------------------
// Display Songs
// -------------------------
function displaySongs(songList) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  songList.forEach(song => {
    const card = document.createElement("div");
    card.className = `song ${song.category || ""} ${song.gold ? "gold" : ""}`;
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
        ${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}
        <span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,"") || ""}">${song.genre || ""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>
      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst => `
          <div class="instrument">
            <img class="instrument-icon" src="${getInstrumentIcon(inst, song)}">
            ${createDifficulty(difficulty[inst])}
          </div>
        `).join("")}
        <div class="more-info-row">
          <button class="more-info-btn">More Info</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// -------------------------
// Difficulty
// -------------------------
function createDifficulty(level) {
  if (level == null || level === -1) return `<div class="no-part">NO PART</div>`;
  let bars = "";
  for (let i=1;i<=5;i++) {
    if (level===6) bars += `<div class="diff red"></div>`;
    else if (i<=level) bars += `<div class="diff filled"></div>`;
    else bars += `<div class="diff"></div>`;
  }
  return `<div class="diff-row">${bars}</div>`;
}

// -------------------------
// Open Song Info
// -------------------------
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  const cover = song.cover || "./assets/default_cover.png";
  document.getElementById("info-cover").src = cover;
  const bg = document.querySelector(".overlay-bg");
  if (bg) bg.style.backgroundImage = `url(${cover})`;
  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year || "";
  document.getElementById("info-release").innerText = song.release || "";

  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].forEach(inst => {
    const elem = document.getElementById(`info-${inst}`);
    if (elem) elem.innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // ✅ Overlay vocals icon
  const vocalsIcon = document.getElementById("info-vocals-icon");
  if (vocalsIcon) {
    let harm = song.Harm || song.harm || 1;
    vocalsIcon.src = `assets/vocals${harm > 1 ? harm : ""}.png`;
  }

  overlay.classList.add("open");
}

// -------------------------
// Close Overlay
// -------------------------
function closeSongInfo() { document.getElementById("song-info-overlay").classList.remove("open"); }

// -------------------------
// Search
// -------------------------
function searchSongs() {
  const input = document.getElementById("search").value.toLowerCase();
  const filtered = songs.filter(song =>
    (song.title || "").toLowerCase().includes(input) ||
    (song.artist || "").toLowerCase().includes(input)
  );
  displaySongs(filtered);
  document.getElementById("song-count").innerText = filtered.length + " songs";
}

// -------------------------
// Other functions (sort, tab, random) remain the same...
// -------------------------
