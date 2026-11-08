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
      
      let coverArt = null;
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
            id: folder,
            game: game.toLowerCase(),
            name: songData.name || 'Unknown Title',
            artist: songData.artist || 'Unknown Artist',
            album: songData.album || 'Unknown Album',
            year: songData.year || '',
            genre: songData.genre || 'Unknown',
            charter: songData.charter || songData.frets || 'Harmonix',
            source: songData.source || game,
            rating: songData.song_rating || '0',
            release: songData.album_track || '',
            guitar: songData.diff_guitar || '-',
            bass: songData.diff_bass || '-',
            drums: songData.diff_drums || '-',
            keys: songData.diff_keys || '-',
            vocals: songData.diff_vocals || '-',
            proguitar: songData.diff_guitar_real || '-',
            probass: songData.diff_bass_real || '-',
            prokeys: songData.diff_keys_real || '-',
            coverArt: coverArt || 'assets/default-cover.png'
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
