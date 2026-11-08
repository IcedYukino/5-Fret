// Replace with your exact GitHub username and repo name
const GITHUB_USER = 'IcedYukino';
const REPO_NAME = '5-Fret';
const BRANCH = 'main'; // Change to 'master' if your default branch uses that name

// Global arrays to keep track of songs for filtering/sorting
let allSongs = [];
let filteredSongs = [];
let currentTab = 'all';

async function loadLibraryFromGitHub() {
  const container = document.getElementById('song-grid');
  const countEl = document.getElementById('song-count');
  container.innerHTML = '<p class="loading">Loading songs from repository...</p>';

  try {
    // 1. Fetch the 'data' folder contents using GitHub API
    const dataUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/data?ref=${BRANCH}`;
    const gamesRes = await fetch(dataUrl);
    if (!gamesRes.ok) throw new Error('Failed to fetch data directory from GitHub.');
    
    const games = await gamesRes.json();
    allSongs = [];

    // 2. Loop through each game directory (e.g., rockband4, fnfestival)
    for (const game of games) {
      if (game.type !== 'dir') continue;

      const gameRes = await fetch(game.url);
      const songFolders = await gameRes.json();

      // 3. Loop through each individual song folder
      for (const songFolder of songFolders) {
        if (songFolder.type !== 'dir') continue;

        const songFilesRes = await fetch(songFolder.url);
        const songFiles = await songFilesRes.json();

        let iniFile = songFiles.find(f => f.name.toLowerCase() === 'song.ini');
        let albumFile = songFiles.find(f => f.name.toLowerCase() === 'album.png' || f.name.toLowerCase() === 'album.jpg');

        if (iniFile) {
          const iniRes = await fetch(iniFile.download_url);
          const iniText = await iniRes.text();
          const songData = parseIniText(iniText);

          allSongs.push({
            id: songFolder.name,
            game: game.name.toLowerCase(), // Maps to game tabs like 'rb1', 'fnfestival', etc.
            name: songData.name || 'Unknown Title',
            artist: songData.artist || 'Unknown Artist',
            album: songData.album || 'Unknown Album',
            year: songData.year || '',
            genre: songData.genre || 'Unknown',
            charter: songData.charter || songData.frets || 'Harmonix',
            source: songData.source || game.name,
            // Difficulty fields
            guitar: songData.diff_guitar || '-',
            bass: songData.diff_bass || '-',
            drums: songData.diff_drums || '-',
            keys: songData.diff_keys || '-',
            vocals: songData.diff_vocals || '-',
            proguitar: songData.diff_guitar_real || '-',
            probass: songData.diff_bass_real || '-',
            prokeys: songData.diff_keys_real || '-',
            coverArt: albumFile ? albumFile.download_url : 'assets/default-cover.png'
          });
        }
      }
    }

    filteredSongs = [...allSongs];
    renderSongs(filteredSongs);
    if (countEl) countEl.innerText = `${allSongs.length} Songs`;

  } catch (err) {
    console.error('Error loading songs:', err);
    container.innerHTML = '<p class="error">Failed to load songs from repository. Check console for details.</p>';
  }
}

// Simple browser-safe INI parser
function parseIniText(text) {
  const result = {};
  let currentSection = result;

  text.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) return;

    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).trim().toLowerCase();
      result[sectionName] = result[sectionName] || {};
      currentSection = result[sectionName];
    } else {
      const eqIndex = line.indexOf('=');
      if (eqIndex !== -1) {
        const key = line.slice(0, eqIndex).trim().toLowerCase();
        const val = line.slice(eqIndex + 1).trim();
        currentSection[key] = val;
      }
    }
  });

  return result.song || result;
}

function renderSongs(songs) {
  const container = document.getElementById('song-grid');
  container.innerHTML = '';

  if (songs.length === 0) {
    container.innerHTML = '<p>No songs found.</p>';
    return;
  }

  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${song.coverArt}" alt="${song.album}" loading="lazy" />
      <div class="song-details">
        <h3>${song.name}</h3>
        <p class="artist">${song.artist}</p>
        <p class="meta">${song.album} (${song.year})</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// Basic search function hooked to the input onkeyup
function searchSongs() {
  const query = document.getElementById('search').value.toLowerCase();
  
  filteredSongs = allSongs.filter(song => {
    const matchesTab = (currentTab === 'all' || song.game.toLowerCase() === currentTab.toLowerCase());
    const matchesSearch = song.name.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  renderSongs(filteredSongs);
}

// Tab switching handler
function switchTab(tabName, element) {
  currentTab = tabName;
  
  // Update active button styling
  document.querySelectorAll('.tabs .tab').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');

  searchSongs();
}

// Sorting handler
function sortSongs(criteria) {
  filteredSongs.sort((a, b) => {
    if (criteria === 'title') {
      return a.name.localeCompare(b.name);
    } else if (criteria === 'artist') {
      return a.artist.localeCompare(b.artist);
    }
    return 0;
  });
  renderSongs(filteredSongs);
}

// Trigger loading on page load
document.addEventListener('DOMContentLoaded', loadLibraryFromGitHub);