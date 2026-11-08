const fs = require('fs');
const path = require('path');
const ini = require('ini');

const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(__dirname, 'songs.json');

function buildManifest() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('Error: "data" directory not found!');
    return;
  }

  const games = fs.readdirSync(DATA_DIR);
  let allSongs = [];

  games.forEach(game => {
    const gamePath = path.join(DATA_DIR, game);
    if (!fs.statSync(gamePath).isDirectory()) return;

    const songFolders = fs.readdirSync(gamePath);

    songFolders.forEach(folder => {
      const songFolderPath = path.join(gamePath, folder);
      if (!fs.statSync(songFolderPath).isDirectory()) return;

      const iniPath = path.join(songFolderPath, 'song.ini');
      const albumPngPath = path.join(songFolderPath, 'album.png');
      const albumJpgPath = path.join(songFolderPath, 'album.jpg');
      
      let coverArt = 'assets/default-cover.png';
      if (fs.existsSync(albumPngPath)) {
        coverArt = `data/${game}/${folder}/album.png`;
      } else if (fs.existsSync(albumJpgPath)) {
        coverArt = `data/${game}/${folder}/album.jpg`;
      }

      if (fs.existsSync(iniPath)) {
        try {
          const iniContent = fs.readFileSync(iniPath, 'utf-8');
          const parsedIni = ini.parse(iniContent);
          const songData = parsedIni.song || parsedIni;

          allSongs.push({
            title: songData.name || 'Unknown Title',
            artist: songData.artist || 'Unknown Artist',
            album: songData.album || 'Unknown Album',
            year: songData.year || '',
            genre: songData.genre || 'Unknown',
            category: game.toLowerCase(),
            cover: coverArt,
            rating: songData.song_rating || 'NR',
            charter: songData.charter || songData.frets || '',
            release: songData.album_track || '',
            difficulty: {
              guitar: songData.diff_guitar !== undefined ? parseInt(songData.diff_guitar) : -1,
              bass: songData.diff_bass !== undefined ? parseInt(songData.diff_bass) : -1,
              drums: songData.diff_drums !== undefined ? parseInt(songData.diff_drums) : -1,
              keys: songData.diff_keys !== undefined ? parseInt(songData.diff_keys) : -1,
              vocals: songData.diff_vocals !== undefined ? parseInt(songData.diff_vocals) : -1,
              proguitar: songData.diff_guitar_real !== undefined ? parseInt(songData.diff_guitar_real) : -1,
              probass: songData.diff_bass_real !== undefined ? parseInt(songData.diff_bass_real) : -1,
              prokeys: songData.diff_keys_real !== undefined ? parseInt(songData.diff_keys_real) : -1
            }
          });
        } catch (err) {
          console.error(`Failed parsing INI for folder "${folder}":`, err.message);
        }
      }
    });
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSongs, null, 2));
  console.log(`Successfully compiled manifest with ${allSongs.length} songs.`);
}

buildManifest();
