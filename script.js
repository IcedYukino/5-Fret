let songs = [];
let currentTab = "all";
let sortDirection = 1;

// Load songs on page load
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs(currentTab);
  setupDropdowns();
  setupOverlay();
  setupSearch();
  setupSort();
  setupRandom();
});

// Load Songs
async function loadSongs(tab) {
  let files = tab === "all" ? await (await fetch("./songlists/index.json")).json() : [tab];
  let loaded = [];
  for(const f of files){
    try{
      const res = await fetch(`./songlists/${f}.json`);
      if(!res.ok) continue;
      const data = await res.json();
      loaded.push(...data);
    }catch{}
  }
  songs = loaded.sort((a,b)=>a.title.localeCompare(b.title));
  displaySongs(songs);
  document.getElementById("song-count").innerText = songs.length + " songs";
}

// Display Songs
function displaySongs(list){
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";
  list.forEach(song=>{
    const card = document.createElement("div");
    card.className="song";
    card.dataset.title=song.title;
    const cover=song.cover||"./assets/default_cover.png";
    const rating=song.rating||"NR";
    card.innerHTML=`
      <div class="cover-container"><img src="${cover}"></div>
      <h3>${song.title}</h3>
      <p>${song.artist||""}</p>
      <div class="genre-row">
        <span class="genre-tag">${song.genre||""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>
      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst=>`
          <div class="instrument">
            <img src="./assets/${inst}.png">
            <div>${createDifficulty(song.difficulty?.[inst])}</div>
          </div>
        `).join("")}
        <button class="more-info-btn">More Info</button>
      </div>
    `;
    grid.appendChild(card);
  });
  setupCardClicks();
}

// Difficulty
function createDifficulty(level){
  if(level==null||level===-1)return"<span class='diff-row'><span class='diff'></span><span class='diff'></span><span class='diff'></span><span class='diff'></span><span class='diff'></span></span>";
  let html="";
  for(let i=1;i<=5;i++) html+=`<span class='diff ${i<=level?"filled":""}'></span>`;
  return `<span class='diff-row'>${html}</span>`;
}

// Dropdown + More Info
function setupCardClicks(){
  document.querySelectorAll(".song").forEach(card=>{
    card.addEventListener("click", e=>{
      const dropdown=card.querySelector(".difficulty-dropdown");
      if(e.target.classList.contains("more-info-btn")){
        const song=songs.find(s=>s.title===card.dataset.title);
        if(song) openOverlay(song);
        return;
      }
      dropdown.classList.toggle("open");
    });
  });
}

// Overlay
function openOverlay(song){
  document.getElementById("overlay").classList.add("open");
  document.getElementById("info-cover").src=song.cover||"./assets/default_cover.png";
  document.getElementById("info-title").innerText=song.title||"";
  document.getElementById("info-artist").innerText=song.artist||"";
  document.getElementById("info-genre").innerText=song.genre||"";
  document.getElementById("info-charter").innerText="Harmonix";
  document.getElementById("info-release").innerText=song.release||"";
  document.getElementById("info-source").innerText=mapSource(song.category);
  const ratingEl=document.getElementById("info-rating");
  ratingEl.innerText=song.rating||"NR";
  ratingEl.className="song-rating "+(song.rating||"NR");
  // Difficulties
  const diffDiv=document.getElementById("info-difficulties");
  diffDiv.innerHTML="";
  ["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].forEach(inst=>{
    diffDiv.innerHTML+=`<div>${inst}: ${createDifficulty(song.difficulty?.[inst])}</div>`;
  });
}
document.getElementById("closeOverlay").addEventListener("click",()=>document.getElementById("overlay").classList.remove("open"));

// Map shortname to full source
function mapSource(cat){
  switch(cat){
    case"rb1":return"Rock Band";
    case"rb1dlc":return"Rock Band DLC";
    case"rb2":return"Rock Band 2";
    case"rb2dlc":return"Rock Band 2 DLC";
    case"rb3":return"Rock Band 3";
    case"rb3dlc":return"Rock Band 3 DLC";
    case"rb4":return"Rock Band 4";
    case"rb4dlc":return"Rock Band 4 DLC";
    case"rb4rivals":return"Rock Band Rivals";
    default:return cat||"";
  }
}

// Search
function setupSearch(){
  document.getElementById("search").addEventListener("keyup", ()=>{
    const val=document.getElementById("search").value.toLowerCase();
    displaySongs(songs.filter(s=>s.title.toLowerCase().includes(val)||s.artist.toLowerCase().includes(val)));
  });
}

// Sort
function setupSort(){
  document.querySelectorAll("[data-sort]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      songs.sort((a,b)=>{
        const A=(a[btn.dataset.sort]||"").toLowerCase();
        const B=(b[btn.dataset.sort]||"").toLowerCase();
        if(A<B)return -1*sortDirection;
        if(A>B)return 1*sortDirection;
        return 0;
      });
      sortDirection*=-1;
      displaySongs(songs);
    });
  });
}

// Random
function setupRandom(){
  document.getElementById("randomSong").addEventListener("click",()=>{
    const song=songs[Math.floor(Math.random()*songs.length)];
    if(!song)return;
    displaySongs(songs);
    setTimeout(()=>{
      document.querySelectorAll(".song").forEach(card=>{
        if(card.dataset.title===song.title){
          card.scrollIntoView({behavior:"smooth",block:"center"});
          card.querySelector(".difficulty-dropdown").classList.add("open");
        }
      });
    },100);
  });
}
