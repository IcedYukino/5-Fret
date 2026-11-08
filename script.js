let songs = [];
let currentTab = "all";
let sortDirection = 1;

window.addEventListener("DOMContentLoaded", async () => {
    await loadSongs("all");
    setupOverlayClose();
});

function formatReleaseDate(date){
    if(!date) return "";
    let separator = date.includes('/') ? '/' : '-';
    const parts = date.split(separator);
    if(parts.length !== 3) return date;

    let year = parts[0];
    let monthIdx = parseInt(parts[1]) - 1;
    let dayNum = parseInt(parts[2]);

    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];
    const month = months[monthIdx];
    if(!month) return date;

    let suffix = "th";
    if (dayNum % 10 === 1 && dayNum !== 11) suffix = "st";
    else if (dayNum % 10 === 2 && dayNum !== 12) suffix = "nd";
    else if (dayNum % 10 === 3 && dayNum !== 13) suffix = "rd";

    return month + " " + dayNum + suffix + ", " + year;
}

async function loadSongs(tab){
    try{
        const dataApiUrl = 'https://api.github.com/repos/IcedYukino/5-Fret/contents/data';
        
        const headers = {};
        const localToken = localStorage.getItem("gh_token");
        if(localToken){
            headers['Authorization'] = `token ${localToken}`;
        }

        const dataRes = await fetch(dataApiUrl, { headers });
        if(!dataRes.ok){
            console.warn(`Failed to fetch game directories from GitHub API. Status: ${dataRes.status}`);
            return;
        }
        const gameFolders = await dataRes.json();
        const loadedSongs = [];

        for(const gameFolder of gameFolders){
            if(gameFolder.type === "dir"){
                const gameName = gameFolder.name;
                const songsApiUrl = `https://api.github.com/repos/IcedYukino/5-Fret/contents/data/${encodeURIComponent(gameName)}`;
                
                const songsRes = await fetch(songsApiUrl, { headers });
                if(!songsRes.ok) continue;
                const songFolders = await songsRes.json();

                for(const folder of songFolders){
                    if(folder.type === "dir"){
                        const folderName = folder.name;
                        const iniUrl = `./data/${encodeURIComponent(gameName)}/${encodeURIComponent(folderName)}/song.ini`;
                        const coverUrl = `./data/${encodeURIComponent(gameName)}/${encodeURIComponent(folderName)}/album.png`;

                        try {
                            const iniRes = await fetch(iniUrl);
                            if(iniRes.ok){
                                const iniText = await iniRes.text();
                                const ini = parseIni(iniText);

                                let rawRating = ini.rating;
                                let ratingCode = "NR";
                                if(rawRating == "1" || rawRating === 1) ratingCode = "FF";
                                else if(rawRating == "2" || rawRating === 2) ratingCode = "SR";
                                else if(rawRating == "3" || rawRating === 3) ratingCode = "M";
                                else ratingCode = "NR";

                                const songObj = {
                                    title: ini.name || folderName,
                                    artist: ini.artist || "Unknown Artist",
                                    album: ini.album || "",
                                    year: ini.year || "",
                                    release: ini.date_released || ini.release || "",
                                    genre: ini.genre || "",
                                    charter: ini.frets || ini.charter || "",
                                    rating: ratingCode,
                                    category: ini.icon || ini.category || "",
                                    master: ini.master !== "false",
                                    file: ini.file || "#",
                                    harm: parseInt(ini.harm) || 1,
                                    cover: coverUrl,
                                    difficulty: {
                                        guitar: ini.diff_guitar !== undefined ? parseInt(ini.diff_guitar) : undefined,
                                        bass: ini.diff_bass !== undefined ? parseInt(ini.diff_bass) : undefined,
                                        drums: ini.diff_drums !== undefined ? parseInt(ini.diff_drums) : undefined,
                                        proguitar: ini.diff_guitar_real !== undefined ? parseInt(ini.diff_guitar_real) : undefined,
                                        probass: ini.diff_bass_real !== undefined ? parseInt(ini.diff_bass_real) : undefined,
                                        keys: ini.diff_keys !== undefined ? parseInt(ini.diff_keys) : undefined,
                                        prokeys: ini.diff_keys_real !== undefined ? parseInt(ini.diff_keys_real) : undefined,
                                        vocals: ini.diff_vocals !== undefined ? parseInt(ini.diff_vocals) : undefined
                                    }
                                };
                                loadedSongs.push(songObj);
                            }
                        } catch(err) {
                            console.warn(`Could not load song.ini for folder: ${folderName}`, err);
                        }
                    }
                }
            }
        }
        
        if(tab === "all"){
            songs = loadedSongs;
        } else {
            songs = loadedSongs.filter(song => song.category && song.category.toLowerCase() === tab.toLowerCase());
        }

        songs.sort((a,b)=>a.title.localeCompare(b.title));
        displaySongs(songs);
        const counter = document.getElementById("song-count");
        if(counter) counter.innerText = songs.length + " songs";
    }catch(err){
        console.warn(`Error loading songs from directory`, err);
    }
}

function parseIni(text){
    const result = {};
    text.split('\n').forEach(line => {
        line = line.trim();
        if(!line || line.startsWith(';') || line.startsWith('#') || (line.startsWith('[') && line.endsWith(']'))) return;
        const eqIndex = line.indexOf('=');
        if(eqIndex !== -1){
            const key = line.substring(0, eqIndex).trim().toLowerCase();
            const value = line.substring(eqIndex + 1).trim();
            result[key] = value;
        }
    });
    return result;
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
        const file = song.file || "#";

        const vocalsImg = `./assets/vocals${song.harm && song.harm > 1 ? song.harm : ''}.png`;

        card.innerHTML = `
<div class="cover-container">
<img src="${song.cover}" loading="lazy">
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
<img class="instrument-icon" src="./assets/proguitar.png">
${createDifficulty(song.difficulty?.proguitar)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/bass.png">
${createDifficulty(song.difficulty?.bass)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/probass.png">
${createDifficulty(song.difficulty?.probass)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/drums.png">
${createDifficulty(song.difficulty?.drums)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/keys.png">
${createDifficulty(song.difficulty?.keys)}
</div>

<div class="instrument">
<img class="instrument-icon" src="./assets/prokeys.png">
${createDifficulty(song.difficulty?.prokeys)}
</div>

<div class="instrument">
<img class="instrument-icon" src="${vocalsImg}">
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
    const overlay = document.getElementById("song-info-overlay");
    const rating = song.rating || "NR";

    document.getElementById("info-cover").src = song.cover;

    const bg = document.querySelector(".overlay-bg");
    if(bg) bg.style.backgroundImage = `url(${song.cover})`;

    document.getElementById("info-title").innerText = song.title || "";
    document.getElementById("info-artist").innerText = song.artist || "";
    document.getElementById("info-album").innerText = song.album || "";
    document.getElementById("info-year").innerText = song.year || "";
    document.getElementById("info-release").innerText = formatReleaseDate(song.release);

    document.getElementById("info-genre").innerHTML = `
<span class="genre-tag ${song.genre?.toLowerCase().replace(/[^a-z]/g,'')}">
${song.genre || ""}
</span>`;

const sourceNames = {
    "rb1": "Rock Band",
    "rb1dlc": "Rock Band DLC",
    "rb2": "Rock Band 2",
    "rb2dlc": "Rock Band 2 DLC",
    "rbn1": "Rock Band Network 1.0",
    "rb3": "Rock Band 3",
    "rb3dlc": "Rock Band 3 DLC",
    "rb4": "Rock Band 4",    
    "rb4dlc": "Rock Band 4 DLC",
    "fnfestival": "Fortnite Festival"
};

const sourceName = sourceNames[song.category] || song.category || "";

document.getElementById("info-source").innerHTML = `
<span class="source-row">
  ${song.category ? `<img class="source-icon" src="./assets/${song.category}.png">` : ""}
  <span>${sourceName}</span>
</span>`;

    const ratingNames = {
        "NR": "Not Rated",
        "FF": "Family Friendly",
        "SR": "Supervision Recommended",
        "M": "Mature"
    };
    
    const ratingText = ratingNames[rating] || rating;

    document.getElementById("info-rating").innerHTML = `
<span class="song-rating ${rating}">
${ratingText}
</span>`;

document.getElementById("info-charter").innerHTML = song.charter 
    ? song.charter 
    : `<span style="color:#0aa3ff">Harmonix</span>`;

    document.getElementById("info-guitar").innerHTML = createDifficulty(song.difficulty?.guitar);
    document.getElementById("info-bass").innerHTML = createDifficulty(song.difficulty?.bass);
    document.getElementById("info-drums").innerHTML = createDifficulty(song.difficulty?.drums);
    document.getElementById("info-proguitar").innerHTML = createDifficulty(song.difficulty?.proguitar);
    document.getElementById("info-probass").innerHTML = createDifficulty(song.difficulty?.probass);
    document.getElementById("info-keys").innerHTML = createDifficulty(song.difficulty?.keys);
    document.getElementById("info-prokeys").innerHTML = createDifficulty(song.difficulty?.prokeys);

const vocalsImg = `./assets/vocals${song.harm && song.harm > 1 ? song.harm : ''}.png`;
const vocalsIcon = document.getElementById("info-vocals-icon");
if (vocalsIcon) vocalsIcon.src = vocalsImg;

const vocalsBars = document.getElementById("info-vocals-bars");
if (vocalsBars) vocalsBars.innerHTML = createDifficulty(song.difficulty?.vocals);

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
    if(counter) counter.innerText = filtered.length + " songs";
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
