let songs = [];
let currentTab = "all";
let sortDirection = 1;

// DOM Loaded
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
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const target = e.target;
    const songCard = target.closest(".song");
    if (!songCard) return;

    const dropdown = songCard.querySelector(".difficulty-dropdown");

    // MORE INFO BUTTON
    if (target.classList.contains("more-info-btn")) {
      const title = songCard.dataset.title?.trim().toLowerCase();
      const song = songs.find(s => s.title?.trim().toLowerCase() === title);
      if (song) openSongInfo(song);
      return;
    }

    // TOGGLE DROPDOWN
    if (dropdown && !target.classList.contains("song-download") && !target.classList.contains("more-info-btn")) {
      const isOpen = dropdown.classList.contains("open");
      document.querySelectorAll(".difficulty-dropdown.open").forEach(d => d.classList.remove("open"));
      if (!isOpen) dropdown.classList.add("open");
    }
  });
}

// ==========================
// Load Songs
// ==========================
async function loadSongs(tab) {
  let files = [];
  if (tab === "all") {
    try { const index = await fetch("./songlists/index.json"); files = await index.json(); } 
    catch(err){ console.error(err); return; }
  } else { files = [tab]; }

  let loadedSongs = [];
  for (const file of files) {
    try {
      const res = await fetch(`./songlists/${file}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      loadedSongs.push(...data);
    } catch(err){ console.warn(err); }
  }

  songs = loadedSongs.sort((a,b)=>a.title.localeCompare(b.title));
  displaySongs(songs);
  document.getElementById("song-count")?.innerText = songs.length + " songs";
}

// ==========================
// Display Songs
// ==========================
function getInstrumentIcon(inst, song){ return inst==="vocals"?`./assets/vocals${(song.Harm||song.harm||1)>1?(song.Harm||song.harm):""}.png`:`./assets/${inst}.png`; }
function createDifficulty(level){
  level = Number(level);
  if(level==null||level===-1||isNaN(level)) return `<div class="no-part">NO PART</div>`;
  let bars=""; for(let i=1;i<=5;i++){ bars += level===6?`<div class="diff red"></div>`:i<=level?`<div class="diff filled"></div>`:`<div class="diff"></div>`; } 
  return `<div class="diff-row">${bars}</div>`;
}

function displaySongs(songList){
  const grid=document.getElementById("song-grid");
  if(!grid) return; grid.innerHTML="";
  songList.forEach(song=>{
    const card=document.createElement("div");
    card.className=`song ${song.category||""} ${song.gold?"gold":""}`;
    card.dataset.title=song.title;
    const rating=song.rating||"NR";
    const coverTag=song.master===false?`<div class="cover-tag">COVER</div>`:"";
    const cover=song.cover||"./assets/default_cover.png";
    const file=song.file||"";
    const difficulty=song.difficulty||{};
    let sourceText="";
    switch(song.category){case"rb1":sourceText="Rock Band";break;case"rb1dlc":sourceText="Rock Band DLC";break;case"rb4rivals":sourceText="Rock Band Rivals";break;default:sourceText=song.category||"";}
    const sourceIcon=song.category?`<img class="source-icon" src="./assets/${song.category}.png">`:"";
    card.innerHTML=`
      <div class="cover-container"><img src="${cover}">${coverTag}</div>
      <h3><a class="song-download ${file?"":"disabled"}" ${file?`href="${file}" download`:""}>${song.title}</a></h3>
      <p>${song.artist||""}</p>
      <div class="genre-row">
        <div class="source-row">${sourceIcon}<span class="source-text">${sourceText}</span></div>
        <span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,"")||""}">${song.genre||""}</span>
        <span class="song-rating ${rating}">${rating}</span>
      </div>
      <div class="difficulty-dropdown">
        ${["guitar","bass","drums","vocals","proguitar","probass","keys","prokeys"].map(inst=>`<div class="instrument"><img class="instrument-icon" src="${getInstrumentIcon(inst,song)}">${createDifficulty(difficulty[inst])}</div>`).join("")}
      </div>
      <button class="more-info-btn">More Info</button>
    `;
    grid.appendChild(card);
  });
}

// ==========================
// Overlay
// ==========================
function openSongInfo(song){
  const overlay=document.getElementById("song-info-overlay"); if(!overlay) return;
  document.getElementById("info-cover")?.setAttribute("src", song.cover||"./assets/default_cover.png");
  document.querySelector(".overlay-bg")?.style.setProperty("background-image",`url(${song.cover||"./assets/default_cover.png"})`);
  ["info-title","info-artist","info-album","info-year","info-release","info-charter"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.innerText=song[id.replace("info-","")]||"";
  });
  ["guitar","proguitar","bass","probass","keys","prokeys","drums","vocals"].forEach(inst=>{
    const el=document.getElementById(`info-${inst}`); if(el) el.innerHTML=createDifficulty(song.difficulty?.[inst]);
  });
  const vocalsIcon=document.getElementById("info-vocals-icon");
  if(vocalsIcon){ let harm=song.Harm||song.harm||1; vocalsIcon.src=`assets/vocals${harm>1?harm:""}.png`; }
  const ratingEl=document.getElementById("info-rating");
  if(ratingEl){ let ratingText="Not Rated",ratingClass="NR"; if(song.rating==="FF"){ratingText="Family Friendly";ratingClass="FF";}else if(song.rating==="SR"){ratingText="Supervision Recommended";ratingClass="SR";} ratingEl.innerText=ratingText; ratingEl.className="info-value "+ratingClass; }
  const infoSourceText=document.getElementById("info-source-text"); if(infoSourceText){ let sourceText=""; switch(song.category){case"rb1":sourceText="Rock Band";break;case"rb1dlc":sourceText="Rock Band DLC";break;case"rb4rivals":sourceText="Rock Band Rivals";break;default:sourceText=song.category||"";} infoSourceText.innerText=sourceText; }
  overlay.classList.add("open");
}
function closeSongInfo(){ document.getElementById("song-info-overlay")?.classList.remove("open"); }
function setupOverlayClose(){
  const overlay=document.getElementById("song-info-overlay");
  overlay?.addEventListener("click",e=>{if(e.target===overlay) closeSongInfo();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape") closeSongInfo();});
}

// ==========================
// Search / Sort / Tabs / Random / Gold
// ==========================
function searchSongs(){
  const input=document.getElementById("search")?.value.toLowerCase()||"";
  const filtered=songs.filter(song=>(song.title||"").toLowerCase().includes(input)||(song.artist||"").toLowerCase().includes(input));
  displaySongs(filtered);
  document.getElementById("song-count")?.innerText=filtered.length+" songs";
}
function sortSongs(type){ songs.sort((a,b)=>{const A=(a[type]||"").toLowerCase();const B=(b[type]||"").toLowerCase(); if(A<B)return -1*sortDirection;if(A>B)return 1*sortDirection;return 0;}); displaySongs(songs); sortDirection*=-1; }
async function switchTab(tab, button){ currentTab=tab; document.querySelectorAll(".tab").forEach(btn=>btn.classList.remove("active")); button.classList.add("active"); sortDirection=1; await loadSongs(tab); }
function setupRandomButton(){ const randomBtn=document.getElementById("randomSong"); if(!randomBtn)return; randomBtn.addEventListener("click",()=>{ if(songs.length===0)return; const random=songs[Math.floor(Math.random()*songs.length)]; displaySongs(songs); setTimeout(()=>{ const cards=document.querySelectorAll(".song"); for(const card of cards){ if(card.querySelector("h3")?.innerText===random.title){ card.scrollIntoView({behavior:"smooth",block:"center"}); card.style.boxShadow="0 0 25px #0aa3ff"; const dropdown=card.querySelector(".difficulty-dropdown"); if(dropdown) dropdown.classList.add("open"); break; } } },100); }); }
function setupGoldToggle(){ const goldCheckbox=document.getElementById("markGoldCheckbox"); if(!goldCheckbox)return; goldCheckbox.addEventListener("change",()=>{ const overlayModal=document.querySelector(".song-info-modal"); if(!overlayModal)return; overlayModal.classList.toggle("gold",goldCheckbox.checked); const title=document.getElementById("info-title")?.innerText; if(!title)return; document.querySelectorAll(".song").forEach(card=>{if(card.querySelector("h3")?.innerText===title) card.classList.toggle("gold",goldCheckbox.checked);}); }); }
