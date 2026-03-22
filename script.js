let songs = [];

// ==========================
// LOAD SONGS FROM JSON
// ==========================
async function loadSongs() {
  const indexRes = await fetch("./songlists/index.json");
  const files = await indexRes.json();

  let allSongs = [];

  for (const file of files) {
    const res = await fetch(`./songlists/${file}.json`);
    const data = await res.json();
    allSongs.push(...data);
  }

  songs = allSongs;
  renderSongs(songs);
}

// ==========================
// RENDER SONGS
// ==========================
function renderSongs(list) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  list.forEach(song => {
    const card = document.createElement("div");
    card.className = "song";

    card.innerHTML = `
      <img src="${song.cover}">
      <h3>${song.title}</h3>
      <p>${song.artist}</p>

      <div class="genre-row">
        <span>${song.genre || ""}</span>
        <span class="song-rating ${song.rating || "NR"}">${song.rating || "NR"}</span>
      </div>

      <div class="dropdown">
        ${renderInstruments(song)}
        <button class="more-info">More Info</button>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.classList.contains("more-info")) {
        e.stopPropagation();
        openOverlay(song);
        return;
      }

      card.querySelector(".dropdown").classList.toggle("open");
    };

    grid.appendChild(card);
  });
}

// ==========================
// INSTRUMENT RENDER
// ==========================
function renderInstruments(song) {
  const instruments = [
    "guitar","bass","drums","vocals",
    "proguitar","probass","keys","prokeys"
  ];

  return instruments.map(inst => {
    const level = song.difficulty?.[inst];
    if (level == null) return "";

    return `
      <div class="instrument">
        <img src="${getInstrumentIcon(inst, song)}">
        ${createDiff(level)}
      </div>
    `;
  }).join("");
}

// ==========================
// ICON HANDLING
// ==========================
function getInstrumentIcon(inst, song) {
  if (inst === "vocals") {
    let harm = song.Harm || song.harm || 1;
    return `./assets/vocals${harm > 1 ? harm : ""}.png`;
  }
  return `./assets/${inst}.png`;
}

// ==========================
// DIFFICULTY
// ==========================
function createDiff(level) {
  if (level === -1) return `<span>NO PART</span>`;

  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="diff ${i <= level ? "filled" : ""}"></span>`;
  }
  return `<div>${out}</div>`;
}

// ==========================
// OVERLAY
// ==========================
function openOverlay(song) {
  document.getElementById("overlay").classList.add("open");

  document.getElementById("info-cover").src = song.cover;
  document.getElementById("info-title").innerText = song.title;
  document.getElementById("info-artist").innerText = song.artist;
  document.getElementById("info-genre").innerText = song.genre || "";

  document.getElementById("info-charter").innerText = "Harmonix";

  // Release formatted
  if (song.release) {
    const d = new Date(song.release);
    document.getElementById("info-release").innerText =
      d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
  }

  // Source mapping
  const sourceMap = {
    rb3dlc: "Rock Band 3 DLC"
  };

  document.getElementById("info-source").innerText =
    sourceMap[song.category] || song.category || "";

  // Rating
  const ratingEl = document.getElementById("info-rating");
  ratingEl.innerText = song.rating || "NR";
  ratingEl.className = "song-rating " + (song.rating || "NR");

  // Difficulties in overlay
  document.getElementById("info-difficulties").innerHTML =
    renderInstruments(song);
}

// ==========================
// SEARCH
// ==========================
function searchSongs() {
  const val = document.getElementById("search").value.toLowerCase();

  renderSongs(songs.filter(s =>
    s.title.toLowerCase().includes(val) ||
    s.artist.toLowerCase().includes(val)
  ));
}

// INIT
loadSongs();
