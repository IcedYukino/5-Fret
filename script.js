let songs = [];
let currentTab = "all";
let sortDirection = 1;

// ==========================
// Category Full Names Mapping
// ==========================
const categoryFullNames = {
  "all": "All Songs",
  "rb1": "Rock Band",
  "rb1dlc": "Rock Band DLC",
  "rb2": "Rock Band 2",
  "rb2dlc": "Rock Band 2 DLC",
  "tbrb": "The Beatles: Rock Band",
  "tbrbdlc": "The Beatles: Rock Band DLC",
  "lrb": "LEGO Rock Band",
  "gdrb": "Green Day: Rock Band",
  "rb3": "Rock Band 3",
  "rb3dlc": "Rock Band 3 DLC",
  "rb_blitz": "Rock Band Blitz",
  "rb4": "Rock Band 4",
  "rb4dlc": "Rock Band 4 DLC",
  "rb4rivals": "Rock Band Rivals"
};

// ==========================
// DOMContentLoaded
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
  setupGoldToggle();
  setupRandomButton();
  setupSongClickHandler();
});

// ==========================
// Song Click Handler
// ==========================
function setupSongClickHandler() {
  const grid = document.getElementById("song-grid");

  grid.addEventListener("click", function(e) {
    const target = e.target;
    const songCard = target.closest(".song");
    if (!songCard) return;

    const dropdown = songCard.querySelector(".difficulty-dropdown");
    if (!dropdown) return;

    // Check if clicked on the More Info button or inside it
    const moreInfoBtn = target.closest(".more-info-btn");
    if (moreInfoBtn) {
      const title = songCard.querySelector("h3")?.innerText;
      const song = songs.find(s => s.title === title);
      if (song) openSongInfo(song);
      return; // stop further processing
    }

    // Toggle dropdown
    const isOpen = dropdown.classList.contains("open");

    // Close all other dropdowns
    document.querySelectorAll(".difficulty-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });

    // Toggle only this one
    if (!isOpen) dropdown.classList.add("open");
    else dropdown.classList.remove("open");
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
// Get Instrument Icon (vocals dynamic)
// ==========================
function getInstrumentIcon(inst, song) {
  if (inst === "vocals") {
    let harm = song.Harm || song.harm || 1;
    return `./assets/vocals${harm > 1 ? harm : ""}.png`;
  }
  return `./assets/${inst}.png`;
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
// Open Song Info Overlay
// ==========================
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  const cover = song.cover || "./assets/default_cover.png";
  document.getElementById("info-cover").src = cover;
  const bg = document.querySelector(".overlay-bg");
  if (bg) bg.style.backgroundImage = `url(${cover})`;

  // Basic song info
  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year || "";
  document.getElementById("info-release").innerText = song.release || "";

  // Source icon + full text
  const sourceIcon = document.getElementById("info-source-icon");
  if (sourceIcon && song.category) {
    sourceIcon.src = `./assets/${song.category}.png`;
  }
  const sourceText = document.getElementById("info-source-text");
  sourceText.innerText = categoryFullNames[song.category] || song.category || "";

  // Other overlay fields
  document.getElementById("info-charter").innerText = song.charter || song.Charter || "";
  document.getElementById("info-genre").innerText = song.genre || "";
  document.getElementById("info-rating").innerText = song.rating || "NR";

  // Difficulty bars
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
    if (A < B) return -1 * sortDirection;
    if (A > B) return 1 * sortDirection;
    return 0;
  });
  displaySongs(songs);
  sortDirection *= -1;
}

// ==========================
// Switch Tabs
// ==========================
async function switchTab(tab, button) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  sortDirection = 1;
  await loadSongs(tab);
}

// ==========================
// Random Song
// ==========================
function setupRandomButton() {
  const randomBtn = document.getElementById("randomSong");
  if (!randomBtn) return;

  randomBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    const random = songs[Math.floor(Math.random() * songs.length)];
    displaySongs(songs);

    setTimeout(() => {
      const cards = document.querySelectorAll(".song");
      for (const card of cards) {
        if (card.querySelector("h3")?.innerText === random.title) {
          card.scrollIntoView({ behavior:"smooth", block:"center" });
          card.style.boxShadow = "0 0 25px #0aa3ff";
          const dropdown = card.querySelector(".difficulty-dropdown");
          if (dropdown) dropdown.classList.add("open");
          break;
        }
      }
    }, 100);
  });
}

// ==========================
// Gold Feature
// ==========================
function setupGoldToggle() {
  const goldCheckbox = document.getElementById("markGoldCheckbox");
  if (!goldCheckbox) return;

  goldCheckbox.addEventListener("change", () => {
    const overlayModal = document.querySelector(".song-info-modal");
    if (!overlayModal) return;

    overlayModal.classList.toggle("gold", goldCheckbox.checked);

    const title = document.getElementById("info-title")?.innerText;
    if (!title) return;

    const cards = document.querySelectorAll(".song");
    cards.forEach(card => {
      const cardTitle = card.querySelector("h3")?.innerText;
      if (cardTitle === title)
        card.classList.toggle("gold", goldCheckbox.checked);
    });
  });
}

function removeGoldStyles() {
  const overlayModal = document.querySelector(".song-info-modal");
  overlayModal.classList.remove("gold");

  const cards = document.querySelectorAll(".song.gold");
  cards.forEach(card => card.classList.remove("gold"));
}
