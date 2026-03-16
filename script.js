let songs = [];
let currentTab = "all";
let sortDirection = 1;

window.addEventListener("DOMContentLoaded", async () => {
    await loadSongs("all");
    setupOverlayClose();
});

function formatReleaseDate(date){

if(!date) return "";

const parts = date.split("-");
if(parts.length !== 3) return date;

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

const month = months[parseInt(parts[0]) - 1];
const day = parseInt(parts[1]);
const year = parts[2];

return month + " " + day + ", " + year;

}

async function loadSongs(tab){

    let files = [];

    if(tab === "gh") files = ["guitarhero"];
    else if(tab === "gh2") files = ["guitarhero2"];
    else if(tab === "ghwor") files = ["guitarherowarriorsofrock"];
    else if(tab === "ghwordlc") files = ["guitarherowarriorsofrockdlc"];
    else if(tab === "rb1dlc") files = ["rockbanddlc"];
    else if(tab === "fnf") files = ["fortnitefestival"];
    else if(tab === "all"){

        try{
            const index = await fetch("./songlists/index.json");
            files = await index.json();
        }catch(err){
            console.error("Failed to load index.json", err);
            return;
        }

    }

    let loadedSongs = [];

    for(const file of files){

        try{

            const res = await fetch(`./songlists/${file}.json`);

            if(!res.ok){
                console.warn(`Missing file: ${file}.json`);
                continue;
            }

            const data = await res.json();
            loadedSongs.push(...data);

        }catch(err){
            console.warn(`Error loading ${file}.json`, err);
        }

    }

    songs = loadedSongs;

    songs.sort((a,b)=>a.title.localeCompare(b.title));

    displaySongs(songs);

    const counter = document.getElementById("song-count");
    if(counter){
        counter.innerText = songs.length + " songs";
    }

}

function displaySongs(songList){

    const grid = document.getElementById("song-grid");
    if(!grid) return;

    grid.innerHTML = "";

    songList.forEach(song => {

        const card = document.createElement("div");
        card.className = `song ${song.category || ""}`;

        const rating = song.rating || "NR";
        const coverTag = song.master === false ? `<div class="cover-tag">COVER</div>` : "";
        const file = song.file || "";

        card.innerHTML = `

<div class="cover-container">
    <img src="${song.cover}">
    ${coverTag}
</div>

<h3>
<a class="song-download"
href="${file}"
download
onclick="event.stopPropagation()">
${song.title}
</a>
</h3>

<p>${song.artist}</p>

<div class="genre-row">

${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}

<span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,'')}">
${song.genre || ""}
</span>

<span class="song-rating ${rating}">
${rating}
</span>

</div>

<div class="difficulty-dropdown">

<div class="instrument">
<img class="instrument-icon" src="./assets/guitar.png">
${createDifficulty(song.difficulty?.guitar)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/bass.png">
${createDifficulty(song.difficulty?.bass)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/drums.png">
${createDifficulty(song.difficulty?.drums)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/vocals.png">
${createDifficulty(song.difficulty?.vocals)}
</div>

<div class="more-info-row">
<button class="more-info-btn">More Info</button>
</div>

</div>
`;

        grid.appendChild(card);

        const dropdown = card.querySelector(".difficulty-dropdown");

        card.addEventListener("click", () => {
            dropdown.classList.toggle("open");
        });

        const infoBtn = card.querySelector(".more-info-btn");

        infoBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openSongInfo(song);
        });

    });

}

function createDifficulty(level){

    if(level === undefined || level === null || level === -1){
        return `<div class="no-part">NO PART</div>`;
    }

    let bars = "";

    for(let i = 1; i <= 5; i++){

        if(level === 6){
            bars += `<div class="diff red"></div>`;
        }
        else if(i <= level){
            bars += `<div class="diff filled"></div>`;
        }
        else{
            bars += `<div class="diff"></div>`;
        }

    }

    return `<div class="diff-row">${bars}</div>`;

}

function openSongInfo(song){

    const favToggle = document.getElementById("favorite-toggle");

favToggle.checked = song.favorite === true;

favToggle.onchange = () => {

song.favorite = favToggle.checked;

const modal = document.querySelector(".song-info-modal");

if(song.favorite){
modal.classList.add("favorite");
}else{
modal.classList.remove("favorite");
}

displaySongs(songs);

};

    const overlay = document.getElementById("song-info-overlay");
    const rating = song.rating || "NR";

    document.getElementById("info-cover").src = song.cover;

    const bg = document.querySelector(".overlay-bg");
    if(bg){
        bg.style.backgroundImage = `url(${song.cover})`;
    }

    document.getElementById("info-title").innerText = song.title || "";
    document.getElementById("info-artist").innerText = song.artist || "";

    document.getElementById("info-album").innerText = song.album || "";
    document.getElementById("info-year").innerText = song.year || "";

    document.getElementById("info-release").innerText =
        formatReleaseDate(song.release);

    document.getElementById("info-genre").innerHTML = `
        <span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,'')}">
            ${song.genre || ""}
        </span>
    `;

    const sourceNames = {
        gh: "Guitar Hero",
        gh2: "Guitar Hero II",
        ghwor: "Guitar Hero: Warriors of Rock",
        ghwordlc: "GH: Warriors of Rock DLC",
        rb1dlc: "Rock Band DLC",
        fnf: "Fortnite Festival"
    };

    const sourceName = sourceNames[song.category] || "";

document.getElementById("info-source").innerHTML =
`<span class="source-row">
${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}
<span>${sourceName}</span>
</span>`;

    let ratingText = rating;

    if(rating === "FF") ratingText = "Family Friendly";
    if(rating === "SR") ratingText = "Supervision Recommended";

    document.getElementById("info-rating").innerHTML = `
        <span class="song-rating ${rating}">
            ${ratingText}
        </span>
    `;

    let charter = song.charter || "";

    if(["gh","gh2","rb1dlc","fnf","rb4dlc"].includes(song.category)){
        charter = `<span style="color:#0078ff">Harmonix</span>`;
    }

    document.getElementById("info-charter").innerHTML = charter;

    document.getElementById("info-guitar").innerHTML = createDifficulty(song.difficulty?.guitar);
    document.getElementById("info-bass").innerHTML = createDifficulty(song.difficulty?.bass);
    document.getElementById("info-drums").innerHTML = createDifficulty(song.difficulty?.drums);
    document.getElementById("info-vocals").innerHTML = createDifficulty(song.difficulty?.vocals);

    document.getElementById("info-proguitar").innerHTML = createDifficulty(song.difficulty?.proguitar);
    document.getElementById("info-probass").innerHTML = createDifficulty(song.difficulty?.probass);
    document.getElementById("info-keys").innerHTML = createDifficulty(song.difficulty?.keys);
    document.getElementById("info-prokeys").innerHTML = createDifficulty(song.difficulty?.prokeys);

    const favToggle = document.getElementById("favorite-toggle");

favToggle.checked = song.favorite === true;

favToggle.onchange = () => {

song.favorite = favToggle.checked;

const modal = document.querySelector(".song-info-modal");

if(song.favorite){
modal.classList.add("favorite");
}else{
modal.classList.remove("favorite");
}

displaySongs(songs);

};

    overlay.classList.add("open");

}

function closeSongInfo(){
    document.getElementById("song-info-overlay").classList.remove("open");
}

function setupOverlayClose(){

    const overlay = document.getElementById("song-info-overlay");

    overlay.addEventListener("click", (e)=>{
        if(e.target === overlay){
            closeSongInfo();
        }
    });

    document.addEventListener("keydown",(e)=>{
        if(e.key === "Escape"){
            closeSongInfo();
        }
    });

}

function searchSongs(){

    const input = document.getElementById("search").value.toLowerCase();

    const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(input) ||
        song.artist.toLowerCase().includes(input)
    );

    displaySongs(filtered);

    const counter = document.getElementById("song-count");
    if(counter){
        counter.innerText = filtered.length + " songs";
    }

}

function sortSongs(type){

    songs.sort((a,b)=>{

        const A = (a[type] || "").toLowerCase();
        const B = (b[type] || "").toLowerCase();

        if(A < B) return -1 * sortDirection;
        if(A > B) return 1 * sortDirection;

        return 0;

    });

    displaySongs(songs);

    sortDirection *= -1;

}

async function switchTab(tab, button){

    currentTab = tab;

    document.querySelectorAll(".tab").forEach(btn=>{
        btn.classList.remove("active");
    });

    button.classList.add("active");

    await loadSongs(tab);

}

window.addEventListener("DOMContentLoaded", () => {

    const randomBtn = document.getElementById("randomSong");
    if(!randomBtn) return;

    randomBtn.addEventListener("click", () => {

        if(songs.length === 0) return;

        const random = songs[Math.floor(Math.random() * songs.length)];

        displaySongs(songs);

        setTimeout(()=>{

            const cards = document.querySelectorAll(".song");

            cards.forEach(card=>{

                if(card.querySelector("h3").innerText === random.title){

                    card.scrollIntoView({
                        behavior:"smooth",
                        block:"center"
                    });

                    card.style.boxShadow = "0 0 25px #0aa3ff";

                    const dropdown = card.querySelector(".difficulty-dropdown");
                    dropdown.classList.add("open");

                }

            });

        },100);

    });

});
