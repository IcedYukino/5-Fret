let songs = [];
let currentTab = "all";
let sortDirection = 1;

// ==========================
// INIT
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupOverlayClose();
});

// ==========================
// LOAD SONGS
// ==========================
async function loadSongs(tab) {
  const index = await fetch("./songlists/index.json");
  const files = await index.json();

  let loaded = [];
  for (const file of files) {
    const res = await fetch(`./songlists/${file}.json`);
    const data = await res.json();
    loaded.push(...data);
  }

  songs = loaded;
  displaySongs(songs);
}

// ==========================
// DISPLAY SONGS (UNCHANGED STYLE)
// ==========================
function displaySongs(songList) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  songList.forEach(song => {
    const card = document.createElement("div");
    card.className = "song";
    card.dataset.title = song.title; // IMPORTANT

    const rating = song.rating || "NR";

    card.innerHTML = `
      <div class="cover-container">
        <img src="${song.cover}">
      </div>

      <h3 class="song-download">${song.title}</h3>
      <p>${song.artist || ""}</p>

      <div class="genre-row">
        <span class="genre-tag">${song.genre || ""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>

      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst => `
          <div class="instrument">
            <img src="./assets/${inst}.png">
            ${createDifficulty(song.difficulty?.[inst])}
          </div>
        `).join("")}

        <button class="more-info-btn">More Info</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================
// CLICK HANDLING (FIXED)
// ==========================
document.getElementById("song-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".song");
  if (!card) return;

  const dropdown = card.querySelector(".difficulty-dropdown");

  // MORE INFO BUTTON
  if (e.target.classList.contains("more-info-btn")) {
    e.stopPropagation();
    const song = songs.find(s => s.title === card.dataset.title);
    if (song) openSongInfo(song);
    return;
  }

  // TOGGLE DROPDOWN
  if (!e.target.classList.contains("song-download")) {
    document.querySelectorAll(".difficulty-dropdown.open")
      .forEach(d => d.classList.remove("open"));

    dropdown.classList.toggle("open");
  }
});

// ==========================
// DIFFICULTY
// ==========================
function createDifficulty(level) {
  if (level == null || level === -1) return `<div class="no-part">NO PART</div>`;

  let bars = "";
  for (let i = 1; i <= 5; i++) {
    bars += `<div class="diff ${i <= level ? "filled" : ""}"></div>`;
  }
  return `<div class="diff-row">${bars}</div>`;
}

// ==========================
// OVERLAY
// ==========================
function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  overlay.classList.add("open");

  document.getElementById("info-cover").src = song.cover;
  document.getElementById("info-title").innerText = song.title;
  document.getElementById("info-artist").innerText = song.artist;

  document.getElementById("info-genre").innerText = song.genre || "";

  // Charter
  const charter = document.getElementById("info-charter");
  charter.innerText = "Harmonix";
  charter.classList.add("harmonix");

  // Release
  const releaseEl = document.getElementById("info-release");
  if (song.release) {
    const d = new Date(song.release);
    releaseEl.innerText = d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  // Source (overlay ONLY)
  const sourceMap = {
    rb3dlc: "Rock Band 3 DLC"
  };

  document.getElementById("info-source-text").innerText =
    sourceMap[song.category] || song.category || "";

  document.getElementById("info-source-icon").src =
    `./assets/${song.category || "default"}.png`;

  // Rating (colored)
  const ratingEl = document.getElementById("info-rating");
  const rating = song.rating || "NR";
  ratingEl.innerText = rating;
  ratingEl.className = "song-rating " + rating;

  // ✅ FIXED DIFFICULTIES
  const instruments = [
    "guitar","bass","drums","vocals",
    "proguitar","probass","keys","prokeys"
  ];

  instruments.forEach(inst => {
    const el = document.getElementById("info-" + inst);
    if (!el) return;

    el.innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // ✅ Vocals icon fix
  const vocalsIcon = document.getElementById("info-vocals-icon");
  if (vocalsIcon) {
    let harm = song.Harm || song.harm || 1;
    vocalsIcon.src = `./assets/vocals${harm > 1 ? harm : ""}.png`;
  }
}

// ==========================
// CLOSE OVERLAY
// ==========================
function setupOverlayClose() {
  const overlay = document.getElementById("song-info-overlay");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.classList.remove("open");
  });
}
