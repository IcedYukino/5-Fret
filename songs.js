@@ -11,25 +11,22 @@ let currentTab = 'all';
async function loadLibraryFromGitHub() {
  const container = document.getElementById('song-grid');
  const countEl = document.getElementById('song-count');
  container.innerHTML = '<p class="loading">Loading songs from repository...</p>';
  if (container) container.innerHTML = '<p class="loading">Loading songs from repository...</p>';

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

@@ -46,14 +43,16 @@ async function loadLibraryFromGitHub() {

          allSongs.push({
            id: songFolder.name,
            game: game.name.toLowerCase(), // Maps to game tabs like 'rb1', 'fnfestival', etc.
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
@@ -75,11 +74,11 @@ async function loadLibraryFromGitHub() {

  } catch (err) {
    console.error('Error loading songs:', err);
    container.innerHTML = '<p class="error">Failed to load songs from repository. Check console for details.</p>';
    if (container) container.innerHTML = '<p class="error">Failed to load songs from repository.</p>';
  }
}

// Simple browser-safe INI parser
// Browser-safe INI parser
function parseIniText(text) {
  const result = {};
  let currentSection = result;
@@ -105,8 +104,10 @@ function parseIniText(text) {
  return result.song || result;
}

// Renders song cards matching typical custom layout expectations
function renderSongs(songs) {
  const container = document.getElementById('song-grid');
  if (!container) return;
  container.innerHTML = '';

  if (songs.length === 0) {
@@ -117,19 +118,54 @@ function renderSongs(songs) {
  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.onclick = () => openSongInfo(song);

    card.innerHTML = `
      <img src="${song.coverArt}" alt="${song.album}" loading="lazy" />
      <div class="song-details">
        <h3>${song.name}</h3>
        <p class="artist">${song.artist}</p>
        <p class="meta">${song.album} (${song.year})</p>
      <img src="${song.coverArt}" class="song-thumb" alt="${song.album}" loading="lazy" />
      <div class="song-meta-wrap">
        <div class="song-title">${song.name}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Basic search function hooked to the input onkeyup
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

@@ -142,18 +178,15 @@ function searchSongs() {
  renderSongs(filteredSongs);
}

// Tab switching handler
// Tab switching
function switchTab(tabName, element) {
  currentTab = tabName;
  
  // Update active button styling
  document.querySelectorAll('.tabs .tab').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');

  searchSongs();
}

// Sorting handler
// Sorting
function sortSongs(criteria) {
  filteredSongs.sort((a, b) => {
    if (criteria === 'title') {
@@ -166,5 +199,16 @@ function sortSongs(criteria) {
  renderSongs(filteredSongs);
}

// Trigger loading on page load
document.addEventListener('DOMContentLoaded', loadLibraryFromGitHub);
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
