let songs = [];
let currentTab = "all";
let sortDirection = 1;

// Initialize
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
  setupGoldToggle();
  setupRandomButton();
});

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
  else if (tab === "fnf") files = ["fortnitefestival"];
  else if (tab === "all") {
    try {
      const index = await fetch("./songlists/index.json");
      files = await index.json();
    } catch (err) { console.error("Failed to load index.json", err); return; }
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

  document.getElementById("song-count").innerText = songs.length + " songs";
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
          .map(inst => `<div class="instrument"><img class="instrument-icon" src="./assets/${inst}.png">${createDifficulty(difficulty[inst])}</div>`).join("")}
        <div class="more-info-row">
          <button class="more-info-btn">More Info</button>
        </div>
      </div>
    `;

    grid.appendChild(card);

    const dropdown = card.querySelector(".difficulty-dropdown");
    const moreInfoBtn = card.querySelector(".more-info-btn");
    const downloadLink = card.querySelector(".song-download");

    // Toggle dropdown when clicking card but NOT on button or link
    card.addEventListener("click", e => {
      if (!moreInfoBtn.contains(e.target) && !downloadLink.contains(e.target)) {
        dropdown.classList.toggle("open");
      }
    });

    // More Info button always opens overlay
    moreInfoBtn.addEventListener("click", e => {
      e.stopPropagation(); // prevent dropdown toggle
      openSongInfo(song);
    });

    // Prevent download link click from toggling dropdown
    downloadLink.addEventListener("click", e => e.stopPropagation());
  });
}

// ==========================
// Create difficulty bars
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
// Overlay
// ==========================
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  overlay.currentSong = song;

  document.getElementById("info-cover").src = song.cover || "./assets/default_cover.png";
  document.querySelector(".overlay-bg").style.backgroundImage = `url(${song.cover || "./assets/default_cover.png"})`;

  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year || "";
  document.getElementById("info-release").innerText = formatReleaseDate(song.release);
  document.getElementById("info-genre").innerHTML = `<span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,"")}">${song.genre || ""}</span>`;

  const sources = { gh:"Guitar Hero", gh2:"Guitar Hero II", ghwor:"GH: Warriors of Rock", ghwordlc:"GH: W.O.R. DLC", rb1dlc:"Rock Band DLC", fnf:"Fortnite Festival" };
  const sourceName = sources[song.category] || "";
  document.getElementById("info-source").innerHTML = `<span class="source-row">${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}<span>${sourceName}</span></span>`;

  let ratingText = song.rating || "NR";
  if (ratingText === "FF") ratingText = "Family Friendly";
  if (ratingText === "SR") ratingText = "Supervision Recommended";
  document.getElementById("info-rating").innerHTML = `<span class="song-rating ${song.rating}">${ratingText}</span>`;

  document.getElementById("info-charter").innerHTML = ["gh","gh2","rb1dlc","fnf","rb4dlc"].includes(song.category) ? `<span class="harmonix-charter">Harmonix</span>` : "";

  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].forEach(inst => {
    document.getElementById(`info-${inst}`).innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // Gold checkbox
  const goldCheckbox = document.getElementById("markGoldCheckbox");
  goldCheckbox.checked = !!song.gold;

  overlay.classList.add("open");
}

function closeSongInfo() {
  document.getElementById("song-info-overlay").classList.remove("open");
}

// ==========================
// Gold toggle
// ==========================
function setupGoldToggle() {
  const goldCheckbox = document.getElementById("markGoldCheckbox");
  goldCheckbox.addEventListener("change", () => {
    const overlay = document.getElementById("song-info-overlay");
    const song = overlay.currentSong;
    if (!song) return;
    song.gold = goldCheckbox.checked;
    applyGoldStyles(song.gold);
    displaySongs(songs);
  });
}

function applyGoldStyles(enable) {
  const overlayModal = document.querySelector(".song-info-modal");
  overlayModal.classList.toggle("gold", enable);

  const overlay = document.getElementById("song-info-overlay");
  const songTitle = overlay.currentSong?.title;
  if (!songTitle) return;

  const cards = document.querySelectorAll(".song");
  cards.forEach(card => {
    if (card.querySelector("h3")?.innerText === songTitle) card.classList.toggle("gold", enable);
  });
}

// ==========================
// Overlay close logic
// ==========================
function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) closeSongInfo(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSongInfo(); });
}

// ==========================
// Other helpers
// ==========================
function searchSongs() {
  const input = document.getElementById("search").value.toLowerCase();
  const filtered = songs.filter(song => (song.title||"").toLowerCase().includes(input) || (song.artist||"").toLowerCase().includes(input));
  displaySongs(filtered);
  document.getElementById("song-count").innerText = filtered.length + " songs";
}

function sortSongs(type) {
  songs.sort((a,b) => {
    const A = (a[type]||"").toLowerCase();
    const B = (b[type]||"").toLowerCase();
    if (A<B) return -1*sortDirection;
    if (A>B) return 1*sortDirection;
    return 0;
  });
  displaySongs(songs);
  sortDirection *= -1;
}

async function switchTab(tab, button) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  sortDirection = 1;
  await loadSongs(tab);
}

function setupRandomButton() {
  const randomBtn = document.getElementById("randomSong");
  randomBtn.addEventListener("click", () => {
    if (songs.length===0) return;
    const random = songs[Math.floor(Math.random()*songs.length)];
    displaySongs(songs);

    setTimeout(() => {
      const cards = document.querySelectorAll(".song");
      for (const card of cards) {
        if (card.querySelector("h3")?.innerText === random.title) {
          card.scrollIntoView({behavior:"smooth", block:"center"});
          card.style.boxShadow = "0 0 25px #0aa3ff";
          card.querySelector(".difficulty-dropdown").classList.add("open");
          break;
        }
      }
    }, 100);
  });
}

function formatReleaseDate(date) {
  if (!date) return "";
  const parts = date.split("-");
  if (parts.length!==3) return date;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[parseInt(parts[0])-1]} ${parseInt(parts[1])}, ${parts[2]}`;
}
