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
  if (container) container.innerHTML = '<p class="loading">Loading songs from repository...</p>';

  try {
    const dataUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/data?ref=${BRANCH}`;
    const gamesRes = await fetch(dataUrl);
    if (!gamesRes.ok) throw new Error('Failed to fetch data directory from GitHub.');
    
    const games = await gamesRes.json();
    allSongs = [];

    for (const game of games) {
      if (game.type !== 'dir') continue;

      const gameRes = await fetch(game.url);
      const songFolders = await gameRes.json();

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
            game: game.name.toLowerCase(),
            name: songData.name || 'Unknown Title',
            artist: songData.artist || 'Unknown Artist',
            album: songData.album || 'Unknown Album',
            year: songData.year || '',
            genre: songData.genre || 'Unknown',
            charter: songData.charter || songData.frets || 'Harmonix',
            source: songData.source || game.name,
            rating: songData.song_rating || '0',
            release: songData.album_track || '',
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
    if (container) container.innerHTML = '<p class="error">Failed to load songs from repository.</p>';
  }
}

// Browser-safe INI parser
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

// Renders song cards matching typical custom layout expectations
function renderSongs(songs) {
  const container = document.getElementById('song-grid');
  if (!container) return;
  container.innerHTML = '';

  if (songs.length === 0) {
    container.innerHTML = '<p>No songs found.</p>';
    return;
  }

  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.onclick = () => openSongInfo(song);

    card.innerHTML = `
      <img src="${song.coverArt}" class="song-thumb" alt="${song.album}" loading="lazy" />
      <div class="song-meta-wrap">
        <div class="song-title">${song.name}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Modal Overlay Handlers
function openSongInfo(song) {
  const overlay = document.getElementById('song-info-overlay');
  if (!overlay) return;

  document.getElementById('info-cover').src = song.coverArt;
  document.getElementById('info-title').innerText = song.name;
  document.getElementById('info-artist').innerText = song.artist;
  document.getElementById('info-album').innerText = song.album;
  document.getElementById('info-year').innerText = song.year;
  document.getElementById('info-genre').innerText = song.genre;
  document.getElementById('info-source').innerText = song.source;
  document.getElementById('info-rating').innerText = song.rating;
  document.getElementById('info-release').innerText = song.release;
  document.getElementById('info-charter').innerText = song.charter;

  // Difficulty bars / values
  document.getElementById('info-guitar').innerText = song.guitar;
  document.getElementById('info-bass').innerText = song.bass;
  document.getElementById('info-drums').innerText = song.drums;
  document.getElementById('info-keys').innerText = song.keys;
  document.getElementById('info-vocals-bars').innerText = song.vocals;
  document.getElementById('info-proguitar').innerText = song.proguitar;
  document.getElementById('info-probass').innerText = song.probass;
  document.getElementById('info-prokeys').innerText = song.prokeys;

  overlay.style.display = 'flex';
}

function closeSongInfo() {
  const overlay = document.getElementById('song-info-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Search filter
function searchSongs() {
  const query = document.getElementById('search').value.toLowerCase();
  
  filteredSongs = allSongs.filter(song => {
    const matchesTab = (currentTab === 'all' || song.game.toLowerCase() === currentTab.toLowerCase());
    const matchesSearch = song.name.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  renderSongs(filteredSongs);
}

// Tab switching
function switchTab(tabName, element) {
  currentTab = tabName;
  document.querySelectorAll('.tabs .tab').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  searchSongs();
}

// Sorting
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

// Random song selector
document.addEventListener('DOMContentLoaded', () => {
  loadLibraryFromGitHub();

  const randomBtn = document.getElementById('randomSong');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      if (filteredSongs.length === 0) return;
      const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
      openSongInfo(randomSong);
    });
  }
});
