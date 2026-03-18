let songs = [];
let currentTab = "all";
let sortDirection = 1;

window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
  setupGoldToggle();
  setupRandomButton();
});

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
  document.getElementById("song-count").innerText = songs.length + " songs";
}

function displaySongs(songList) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  songList.forEach(song => {
    const card = document.createElement("div");
    card.className = `song ${song.category || ""}`;
    const rating = song.rating || "NR";
    const coverTag = song.master === false ? `<div class="cover-tag">COVER</div>` : "";
    const cover = song.cover || "./assets/default_cover.png";

    card.innerHTML = `
      <div class="cover-container">
        <img src="${cover}">
        ${coverTag}
      </div>
      <h3>
        <a class="song-download" ${song.file ? `href="${song.file}" download` : "disabled"} onclick="event.stopPropagation()">
          ${song.title}
        </a>
      </h3>
      <p>${song.artist || ""}</p>
    `;

    card.addEventListener("click", () => openSongInfo(song));
    grid.appendChild(card);
  });
}

function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  overlay.classList.add("open");
  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-cover").src = song.cover || "./assets/default_cover.png";

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

function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) closeSongInfo(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSongInfo(); });
}

function setupGoldToggle() {
  const goldCheckbox = document.getElementById("markGoldCheckbox");
  if (!goldCheckbox) return;
  goldCheckbox.addEventListener("change", () => {
    const overlayModal = document.querySelector(".song-info-modal");
    overlayModal.classList.toggle("gold", goldCheckbox.checked);

    const title = document.getElementById("info-title")?.innerText;
    document.querySelectorAll(".song").forEach(card => {
      if (card.querySelector("h3")?.innerText === title) card.classList.toggle("gold", goldCheckbox.checked);
    });
  });
}

function removeGoldStyles() {
  document.querySelector(".song-info-modal")?.classList.remove("gold");
  document.querySelectorAll(".song.gold").forEach(card => card.classList.remove("gold"));
}

function searchSongs() {
  const input = document.getElementById("search").value.toLowerCase();
  const filtered = songs.filter(song => (song.title || "").toLowerCase().includes(input) || (song.artist || "").toLowerCase().includes(input));
  displaySongs(filtered);
}

function sortSongs(type) {
  songs.sort((a,b) => ((a[type]||"").toLowerCase() < (b[type]||"").toLowerCase() ? -1*sortDirection : 1*sortDirection));
  sortDirection *= -1;
  displaySongs(songs);
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
  randomBtn?.addEventListener("click", () => {
    if (!songs.length) return;
    const random = songs[Math.floor(Math.random()*songs.length)];
    displaySongs(songs);
  });
}
