let songs = [];

window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("./songlists/index.json");
  const files = await res.json();

  let all = [];
  for (const file of files) {
    const r = await fetch(`./songlists/${file}.json`);
    const d = await r.json();
    all.push(...d);
  }

  songs = all;
  displaySongs(songs);
});

function displaySongs(list) {
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
        <span class="genre-tag">${song.genre || ""}</span>
        <span class="song-rating ${song.rating || "NR"}">${song.rating || "NR"}</span>
      </div>

      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals"].map(inst=>`
          <div class="instrument">
            <img src="./assets/${inst}.png">
            ${createDifficulty(song.difficulty?.[inst])}
          </div>
        `).join("")}

        <button class="more-info-btn">More Info</button>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.classList.contains("more-info-btn")) {
        openSongInfo(song);
        return;
      }

      card.querySelector(".difficulty-dropdown").classList.toggle("open");
    };

    grid.appendChild(card);
  });
}

function createDifficulty(level) {
  if (level == null) return "";

  let bars = "";
  for (let i = 1; i <= 5; i++) {
    bars += `<div class="diff ${i <= level ? "filled" : ""}"></div>`;
  }
  return `<div class="diff-row">${bars}</div>`;
}

function openSongInfo(song) {
  document.getElementById("song-info-overlay").classList.add("open");

  document.getElementById("info-cover").src = song.cover;
  document.getElementById("info-title").innerText = song.title;
  document.getElementById("info-artist").innerText = song.artist;

  document.getElementById("info-genre").innerText = song.genre || "";
  document.getElementById("info-charter").innerText = "Harmonix";

  // release formatted
  if (song.release) {
    const d = new Date(song.release);
    document.getElementById("info-release").innerText =
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // source text
  const map = {
    rb3dlc: "Rock Band 3 DLC"
  };
  document.getElementById("info-source-text").innerText = map[song.category] || song.category;
  document.getElementById("info-source-icon").src = `./assets/${song.category}.png`;

  // rating (colored)
  const ratingEl = document.getElementById("info-rating");
  ratingEl.innerText = song.rating || "NR";
  ratingEl.className = "song-rating " + (song.rating || "NR");

  // difficulties
  ["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].forEach(inst => {
    const el = document.getElementById("info-" + inst);
    if (!el) return;
    el.innerHTML = createDifficulty(song.difficulty?.[inst]);
  });

  // vocals icon fix
  const v = document.getElementById("info-vocals-icon");
  if (v) v.src = "./assets/vocals1.png";
}

function searchSongs() {
  const val = document.getElementById("search").value.toLowerCase();
  displaySongs(songs.filter(s =>
    s.title.toLowerCase().includes(val) ||
    s.artist.toLowerCase().includes(val)
  ));
}
