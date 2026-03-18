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
    } catch { return; }
  } else { files = [tab]; }

  let loadedSongs = [];
  for (const file of files) {
    try {
      const res = await fetch(`./songlists/${file}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      loadedSongs.push(...data);
    } catch {}
  }
  songs = loadedSongs.sort((a,b)=>a.title.localeCompare(b.title));
  displaySongs(songs);

  const counter = document.getElementById("song-count");
  if (counter) counter.innerText = songs.length + " songs";
}

function displaySongs(songList) {
  const grid = document.getElementById("song-grid");
  if (!grid) return;
  grid.innerHTML = "";

  songList.forEach(song => {
    const card = document.createElement("div");
    card.className = `song ${song.category || ""}`;
    const rating = song.rating || "NR";
    const coverTag = song.master === false ? `<div class="cover-tag">COVER</div>` : "";
    const cover = song.cover || "./assets/default_cover.png";
    const difficulty = song.difficulty || {};
    card.innerHTML = `
      <div class="cover-container"><img src="${cover}">${coverTag}</div>
      <h3><a class="song-download" ${song.file ? `href="${song.file}" download` : "disabled"} onclick="event.stopPropagation()">${song.title}</a></h3>
      <p>${song.artist || ""}</p>
      <div class="genre-row">
        ${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}
        <span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,"") || ""}">${song.genre||""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>
      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst=>`<div class="instrument"><img class="instrument-icon" src="./assets/${inst}.png">${createDifficulty(difficulty[inst])}</div>`).join("")}
        <div class="more-info-row"><button class="more-info-btn">More Info</button></div>
      </div>
    `;
    grid.appendChild(card);

    const dropdown = card.querySelector(".difficulty-dropdown");
    card.addEventListener("click", () => dropdown.classList.toggle("open"));
    const infoBtn = card.querySelector(".more-info-btn");
    infoBtn.addEventListener("click", (e)=>{
      e.stopPropagation();
      openSongInfo(song);
    });
  });
}

function createDifficulty(level) {
  if (level == null || level===-1) return `<div class="no-part">NO PART</div>`;
  let bars="";
  for (let i=1;i<=5;i++) {
    if(level===6) bars+=`<div class="diff red"></div>`;
    else if(i<=level) bars+=`<div class="diff filled"></div>`;
    else bars+=`<div class="diff"></div>`;
  }
  return `<div class="diff-row">${bars}</div>`;
}

function openSongInfo(song) {
  const overlay = document.getElementById("song-info-overlay");
  overlay.classList.add("open");

  const goldCheckbox = document.getElementById("markGoldCheckbox");
  if(goldCheckbox){ goldCheckbox.checked=false; removeGoldStyles(); }

  document.getElementById("info-title").innerText = song.title || "";
  document.getElementById("info-artist").innerText = song.artist || "";
  document.getElementById("info-album").innerText = song.album || "";
  document.getElementById("info-year").innerText = song.year
