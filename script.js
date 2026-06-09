const ALBUMS = [
    {
        name: "Secretos",
        artist: "Jose Jose",
        cover: "josejose.jpg",
        vinylImg: "vinyl1.png",
        labelImg: "josejose.jpg",
        tracks: [
            { title: "Lo Dudo", src: "j1.mp3" },
            { title: "El Amor Acaba", src: "j2.mp3" },
            { title: "Voy a Llenarte Toda", src: "j3.mp3" },
            { title: "Cuando Vayas Conmigo", src: "j4.mp3" },
            { title: "Entre Ella y Tú", src: "j5.mp3" },
            { title: "Lágrimas", src: "j6.mp3" },
            { title: "He Renunciado a Ti", src: "j7.mp3" },
            { title: "Quiero Perderme Contigo", src: "j8.mp3" },
            { title: "Esta Noche Te Voy a Estrenar", src: "j9.mp3" },
            { title: "A Esa", src: "j10.mp3" },
        ]
    },
    {
        name: "Donde Estan Los Ladrones",
        artist: "Shakira",
        cover: "shakira.jpg",
        vinylImg: "vinyl2.png",
        labelImg: "label2.png",
        tracks: [
            { title: "Ciega, Sordomuda", src: "s1.mp3" },
            { title: "Si Te Vas", src: "s2.mp3" },
            { title: "Moscas En La Casa", src: "s3.mp3" },
            { title: "No Creo", src: "s4.mp3" },
            { title: "Inevitable", src: "s5.mp3" },
            { title: "Octavo Día", src: "s6.mp3" },
            { title: "Que Vuelvas", src: "s7.mp3" },
            { title: "Tú", src: "s8.mp3" },
            { title: "Sombra de Ti", src: "s9.mp3" },
            { title: "¿Dónde Están los Ladrones?", src: "s10.mp3" },
            { title: "Ojos Así", src: "s11.mp3" },
        ]
    },
    {
        name: "Programaton",
        artist: "Zoe",
        cover: "zoe.jpg",
        vinylImg: null,
        labelImg: null,
        tracks: [
            { title: "10 A.M.", src: "z1.mp3" },
            { title: "Camara Lenta", src: "z2.mp3" },
            { title: "Dos Mil Trece", src: "z3.mp3" },
            { title: "Fin De Semana", src: "z4.mp3" },
            { title: "Arrullo De Estrellas", src: "z5.mp3" },
            { title: "Ciudades Invisibles", src: "z6.mp3" },
            { title: "Panoramas", src: "z7.mp3" },
            { title: "Game Over Shanghai(Liu Yang River)", src: "z8.mp3" },
            { title: "Andromeda", src: "z9.mp3" },
            { title: "Sedantes", src: "z10.mp3" },
            { title: "Altamar", src: "z11.mp3" },
        ]
    },
    {
        name: "Solstis",
        artist: "Leon Larregui",
        cover: "larregui.jpg",
        vinylImg: null,
        labelImg: null,
        tracks: [
            { title: "Aurora Boreal", src: "l1.mp3" },
            { title: "Brillas", src: "l2.mp3" },
            { title: "Carmin", src: "l3.mp3" },
            { title: "Souvenir", src: "l4.mp3" },
            { title: "Como Tu(Magic Music Box)", src: "l5.mp3" },
            { title: "Perdonar", src: "l6.mp3" },
            { title: "Resistolux", src: "l7.mp3" },
            { title: "Perdida Total", src: "l8.mp3" },
            { title: "Femme Fatal", src: "l9.mp3" },
            { title: "Resguardum Ether", src: "l10.mp3" },
        ]
    },
];

let currentAlbumIdx = null;
let currentTrackIdx = null;
let isPlaying = false;

const audio = document.getElementById('reproductorAudio');
const vinylImg = document.getElementById('imgVinilo');
const npTitle = document.getElementById('tituloActual');
const npArtist = document.getElementById('artistaActual');
const progressFill = document.getElementById('rellenoProgreso');
const progressBg = document.getElementById('fondoProgreso');
const timeElapsed = document.getElementById('tiempoTranscurrido');
const timeDuration = document.getElementById('duracionTiempo');
const tracklist = document.getElementById('listaPistas');
const btnPlay = document.getElementById('btnReproducir');
const btnStop = document.getElementById('btnDetener');
const btnPrev = document.querySelector('.prev-btn');
const btnNext = document.querySelector('.next-btn');
const volumeSlider = document.getElementById('deslizadorVolumen');
const shelf = document.getElementById('estanteAlbum');

function buildShelf() {
    shelf.innerHTML = '';
    ALBUMS.forEach((album, i) => {
        const slot = document.createElement('div');
        slot.className = 'ranura-album';
        slot.setAttribute('role', 'listitem');
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('aria-label', `${album.name} por ${album.artist}`);
        slot.dataset.idx = i;

        if (album.cover) {
            const img = document.createElement('img');
            img.src = album.cover;
            img.alt = album.name;
            img.className = 'portada-album';
            img.onerror = () => { slot.querySelector('.portada-album').replaceWith(makePlaceholder(album)); };
            slot.appendChild(img);
        } else {
            slot.appendChild(makePlaceholder(album));
        }

        slot.addEventListener('click', () => selectAlbum(i));
        slot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAlbum(i); } });

        shelf.appendChild(slot);
    });
}

function makePlaceholder(album) {
    const div = document.createElement('div');
    div.className = 'portada-album-marcador';
    div.textContent = album.name;
    return div;
}

function selectAlbum(idx) {
    if (currentAlbumIdx === idx) return;

    stopPlayback();
    currentAlbumIdx = idx;
    currentTrackIdx = null;

    const album = ALBUMS[idx];

    document.querySelectorAll('.ranura-album').forEach((s, i) => {
        s.classList.toggle('activo', i === idx);
    });

    vinylImg.src = album.cover;

    npTitle.textContent = album.name;
    npArtist.textContent = album.artist;

    buildTracklist(album);

    btnPlay.disabled = false;
}

function buildTracklist(album) {
    tracklist.innerHTML = '';
    album.tracks.forEach((track, i) => {
        const li = document.createElement('li');
        li.className = 'item-pista';
        li.dataset.idx = i;
        li.setAttribute('tabindex', '0');
        li.setAttribute('role', 'button');
        li.setAttribute('aria-label', `Reproducir ${track.title}`);

        li.innerHTML = `
      <span class="num-pista">
        <span class="val-num-pista">${i + 1}</span>
      </span>
      <span class="nombre-pista">${track.title}</span>
      <span class="dur-pista" id="durpista-${i}">—</span>
    `;

        li.addEventListener('click', () => playTrack(i));
        li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playTrack(i); } });

        tracklist.appendChild(li);
    });

    loadDurations(album);
}

function loadDurations(album) {
    album.tracks.forEach((track, i) => {
        const tmp = new Audio();
        tmp.src = track.src;
        tmp.preload = 'metadata';
        tmp.addEventListener('loadedmetadata', () => {
            const el = document.getElementById(`durpista-${i}`);
            if (el) el.textContent = formatTime(tmp.duration);
        });
    });
}

function playTrack(trackIdx) {
    if (currentAlbumIdx === null) return;

    currentTrackIdx = trackIdx;
    const album = ALBUMS[currentAlbumIdx];
    const track = album.tracks[trackIdx];

    audio.src = track.src;
    audio.volume = parseFloat(volumeSlider.value);
    audio.play().catch(e => console.warn('Audio error:', e));

    isPlaying = true;
    updatePlayingState();
    npTitle.textContent = track.title;
    npArtist.textContent = album.artist;

    document.querySelectorAll('.item-pista').forEach((el, i) => {
        el.classList.toggle('reproduciendo', i === trackIdx);
    });
}

function playNext() {
    if (currentAlbumIdx === null) return;
    const album = ALBUMS[currentAlbumIdx];
    let nextIdx = (currentTrackIdx === null) ? 0 : Number(currentTrackIdx) + 1;
    
    if (nextIdx >= album.tracks.length) nextIdx = 0; 
    playTrack(nextIdx);
}

function playPrev() {
    if (currentAlbumIdx === null) return;

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        if (audio.paused && isPlaying) {
            audio.play().catch(e => console.warn("Error reanudando:", e));
        }
    } else {
        const album = ALBUMS[currentAlbumIdx];
        let prevIdx = (currentTrackIdx === null || Number(currentTrackIdx) <= 0) 
            ? album.tracks.length - 1 
            : Number(currentTrackIdx) - 1;
        playTrack(prevIdx);
    }
}

function togglePlay() {
    if (currentAlbumIdx === null) return;

    if (audio.src && audio.src !== window.location.href && !audio.ended) {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    } else {
        const startIdx = currentTrackIdx !== null ? currentTrackIdx : 0;
        playTrack(startIdx);
    }
}

function stopPlayback() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayingState();
    progressFill.style.width = '0%';
    timeElapsed.textContent = '0:00';
    document.querySelectorAll('.item-pista').forEach(el => el.classList.remove('reproduciendo'));
}

function updatePlayingState() {
    const playing = !audio.paused && audio.src !== "" && audio.src !== window.location.href;
    btnPlay.innerHTML = playing ? '&#9646;&#9646;' : '&#9654;';
    btnPlay.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    btnStop.disabled = !audio.src || audio.src === window.location.href;
}

audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    progressBg.setAttribute('aria-valuenow', Math.round(pct));
    timeElapsed.textContent = formatTime(audio.currentTime);
    timeDuration.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
    playNext();
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayingState();
});
audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayingState();
});

progressBg.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = progressBg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    audio.currentTime = (x / rect.width) * audio.duration;
});

progressBg.addEventListener('keydown', e => {
    if (!audio.duration) return;
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
});

volumeSlider.addEventListener('input', () => {
    audio.volume = parseFloat(volumeSlider.value);
});

btnPlay.addEventListener('click', togglePlay);
btnStop.addEventListener('click', stopPlayback);
if (btnPrev) btnPrev.addEventListener('click', playPrev);
if (btnNext) btnNext.addEventListener('click', playNext);

function formatTime(s) {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

buildShelf();