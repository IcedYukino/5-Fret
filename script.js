let songs = [
  {
    title: "Test Song",
    artist: "Artist",
    genre: "Rock",
    rating: "FF",
    category: "rb3dlc",
    release: "2000-01-01",
    cover: "https://via.placeholder.com/300",
    difficulty: { guitar: 3, bass: 2, drums: 4, vocals: 1 }
  }
];

// RENDER
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
        <span>${song.genre}</span>
        <span class="song-rating ${song.rating}">${song.rating}</span>
      </div>

      <div class="dropdown">
        ${["guitar","bass","drums","vocals"].map(inst =>
          createDiff(song.difficulty[inst])
        ).join("")}

        <button class="more-info">More Info</button>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.classList.contains("more-info")) {
        openOverlay(song);
        return;
      }

      card.querySelector(".dropdown").classList.toggle("open");
    };

    grid.appendChild(card);
  });
}

// DIFF
function createDiff(level) {
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="diff ${i <= level ? "filled" : ""}"></span>`;
  }
  return `<div>${out}</div>`;
}

// OVERLAY
function openOverlay(song) {
  document.getElementById("overlay").classList.add("open");

  document.getElementById("info-cover").src = song.cover;
  document.getElementById("info-title").innerText = song.title;
  document.getElementById("info-artist").innerText = song.artist;
  document.getElementById("info-genre").innerText = song.genre;
  document.getElementById("info-charter").innerText = "Harmonix";
  document.getElementById("info-source").innerText = "Rock Band 3 DLC";
  document.getElementById("info-rating").innerText = song.rating;

  const d = new Date(song.release);
  document.getElementById("info-release").innerText =
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  document.getElementById("info-difficulties").innerHTML =
    ["guitar","bass","drums","vocals"].map(inst =>
      createDiff(song.difficulty[inst])
    ).join("");
}

// SEARCH
function searchSongs() {
  const val = document.getElementById("search").value.toLowerCase();
  renderSongs(songs.filter(s =>
    s.title.toLowerCase().includes(val) ||
    s.artist.toLowerCase().includes(val)
  ));
}

// INIT
renderSongs(songs);
