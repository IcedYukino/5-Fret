let songs = [];
let currentTab = "all";
let sortDirection = 1;

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

    if (target.classList.contains("more-info-btn")) {
      const title = songCard.querySelector("h3")?.innerText;
      const song = songs.find(s => s.title === title);
      if (song) openSongInfo(song);
    } 
    else if (!target.classList.contains("song-download")) {

      const isOpen = dropdown.classList.contains("open");

      document.querySelectorAll(".difficulty-dropdown.open")
        .forEach(d => d.classList.remove("open"));

      if (!isOpen) dropdown.classList.add("open");
    }
  });
}

// ==========================
// Load Songs
// ==========================
async function loadSongs(tab) {
  let files = [];

  if (tab === "gh") files = ["guitarhero"];
  else if (tab === "gh2") files = ["guitarhero2"];
  else if (tab === "ghwor") files = ["guitarherowarriorsofrock"];
  else if (tab === "ghwordlc") files = ["guitarherowarriorsofrockdlc"];
  else if (tab === "rb1dlc") files = ["rockbanddlc"];
  else if (tab === "rb3dlc") files = ["rockband3dlc"];
  else if (tab === "rb4dlc") files = ["rockband4dlc"];  
  else if (tab === "fnf") files = ["fortnitefestival"];
  else if (tab === "all") {
    try {
      const index = await fetch("./songlists/index.json");
      files = await index.json();
    } catch (err) {
      console.error("Failed to load index.json", err);
      return;
    }
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
// Instrument Icon Logic (NEW)
// ==========================
function getInstrumentIcon(inst, song) {
  if (inst === "vocals") {
    let harm = song.Harm || 1;
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
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"]
          .map(inst => `
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
// Open Song Info
// ==========================
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
  document.getElementById("info-release").innerText = formatReleaseDate(song.release);

  document.getElementById("info-genre").innerHTML =
    `<span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g, "")}">${song.genre || ""}</span>`;

  const sources = {
    gh:"Guitar Hero", gh2:"Guitar Hero II",
    ghwor:"GH: Warriors of Rock", ghwordlc:"GH: W.O.R. DLC",
    rb1dlc:"Rock Band DLC", fnf:"Fortnite Festival",
    rb4dlc:"Rock Band 4 DLC", rb3dlc:"Rock Band 3 DLC"
  };

  const sourceName = sources[song.category] || "";

  document.getElementById("info-source").innerHTML =
    `<span class="source-row">
      ${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}
      <span>${sourceName}</span>
    </span>`;

  let ratingText = song.rating || "NR";
  if (ratingText === "FF") ratingText = "Family Friendly";
  if (ratingText === "SR") ratingText = "Supervision Recommended";

  document.getElementById("info-rating").innerHTML =
    `<span class="song-rating ${song.rating}">${ratingText}</span>`;

  let charter = song.charter || "";
  if (["gh","gh2","rb1dlc","fnf","rb4dlc","rb3dlc"].includes(song.category))
    charter = `<span style="color:#0078ff">Harmonix</span>`;

  document.getElementById("info-charter").innerHTML = charter;

  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"]
    .forEach(inst => {
      const elem = document.getElementById(`info-${inst}`);
      if (elem) elem.innerHTML = createDifficulty(song.difficulty?.[inst]);
    });

  // ✅ Overlay vocals icon logic
  const vocalsIcon = document.getElementById("info-vocals-icon");
  if (vocalsIcon) {
    let harm = song.Harm || 1;
    vocalsIcon.src = `assets/vocals${harm > 1 ? harm : ""}.png`;
  }

  overlay.classList.add("open");

  const goldCheckbox = document.getElementById("markGoldCheckbox");
  if (goldCheckbox) {
    goldCheckbox.checked = false;
    removeGoldStyles();
  }
}

function closeSongInfo() {
  document.getElementById("song-info-overlay").classList.remove("open");
  removeGoldStyles();
}

// ==========================
// Overlay close logic
// ==========================
function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSongInfo();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSongInfo();
  });
}

// ==========================
// Search
// ==========================
function searchSongs() {
  const input = document.getElementById("search").value.toLowerCase();

  const filtered = songs.filter(song =>
    (song.title || "").toLowerCase().includes(input) ||
    (song.artist || "").toLowerCase().includes(input)
  );

  displaySongs(filtered);

  const counter = document.getElementById("song-count");
  if (counter) counter.innerText = filtered.length + " songs";
}

// ==========================
// Sort
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

  document.querySelectorAll(".tab")
    .forEach(btn => btn.classList.remove("active"));

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

    const random = songs[Math.floor(Math.random()*songs.length)];
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

// ==========================
// Format release date
// ==========================
function formatReleaseDate(date) {
  if (!date) return "";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return `${months[parseInt(parts[0])-1]} ${parseInt(parts[1])}, ${parts[2]}`;
}
