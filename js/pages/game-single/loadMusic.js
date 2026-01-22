document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameKey = urlParams.get('id');

    if (!gameKey) return;

    const response = await fetch('json/games.json');
    if (!response.ok) return;

    const data = await response.json();
    const game = data.projects?.[gameKey];

    if (!game || !Array.isArray(game.music) || game.music.length === 0) return;

    const section = document.createElement('section');
    section.className = 'music-section full-width extra-materials';
    section.innerHTML = `
        <h3 class="section-title">Доп. материалы</h3>
        <div class="music-playlists-container" id="music-playlists-container"></div>
    `;
    document.querySelector('main').appendChild(section);

    const container = section.querySelector('#music-playlists-container');
    let currentAudio = new Audio();
    let currentTrackElement = null;
    let currentPlaylistCover = '';
    let isSeeking = false;

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const miniPlayer = document.createElement('div');
    miniPlayer.id = 'mini-player';
    miniPlayer.className = 'mini-player no-select';
    miniPlayer.innerHTML = `
        <button class="mini-player-close" id="mini-player-close">×</button>
        <div class="mini-player-cover">
            <img src="" alt="Обложка трека">
        </div>
        <div class="mini-player-info">
            <p class="mini-player-track-name">Трек</p>
            <div class="mini-player-time-row">
                <span class="current">0:00</span>
                <input type="range" class="mini-player-seek" value="0" min="0" max="100" step="0.1">
                <span class="duration">0:00</span>
            </div>
        </div>
        <div class="mini-player-controls">
            <button class="mini-player-play" id="mini-player-play">
                <i class="fa-solid fa-pause"></i>
            </button>
        </div>
    `;
    document.body.appendChild(miniPlayer);

    const miniPlayerPlay = document.getElementById('mini-player-play');
    const miniPlayerSeek = miniPlayer.querySelector('.mini-player-seek');
    const miniPlayerCurrentTime = miniPlayer.querySelector('.mini-player-time-row .current');
    const miniPlayerDurationTime = miniPlayer.querySelector('.mini-player-time-row .duration');
    const miniPlayerTrackName = miniPlayer.querySelector('.mini-player-track-name');
    const miniPlayerCover = miniPlayer.querySelector('.mini-player-cover img');
    const miniPlayerClose = document.getElementById('mini-player-close');

    const updateMiniPlayer = () => {
        if (!currentAudio.duration) return;
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        miniPlayerSeek.value = isNaN(progress) ? 0 : progress;
        miniPlayerCurrentTime.textContent = formatTime(currentAudio.currentTime);
        miniPlayerDurationTime.textContent = formatTime(currentAudio.duration);
    };

    const showMiniPlayer = () => {
        if (!currentTrackElement) return;
        const rect = currentTrackElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isVisible) {
            miniPlayer.classList.add('show');
        }
    };

    const hideMiniPlayer = () => {
        miniPlayer.classList.remove('show');
    };

    const toggleMiniPlayerPlay = () => {
        const icon = miniPlayerPlay.querySelector('i');
        if (currentAudio.paused) {
            icon.className = 'fa-solid fa-play';
        } else {
            icon.className = 'fa-solid fa-pause';
        }
    };

    const playTrack = (trackEl, fileSrc, duration) => {
        if (isSeeking) {
            isSeeking = false;
            return;
        }

        if (currentTrackElement === trackEl) {
            if (!currentAudio.paused) {
                currentAudio.pause();
                trackEl.querySelector('.track-play-btn i').className = 'fa-solid fa-play';
                const seek = trackEl.querySelector('.track-seek-inline');
                const time = trackEl.querySelector('.track-current-time');
                if (seek) seek.style.display = 'none';
                if (time) time.style.display = 'none';
                trackEl.classList.remove('playing');
                currentTrackElement = null;
                hideMiniPlayer();
            } else {
                currentAudio.play().catch(() => {});
                trackEl.querySelector('.track-play-btn i').className = 'fa-solid fa-pause';
                const seek = trackEl.querySelector('.track-seek-inline');
                const time = trackEl.querySelector('.track-current-time');
                if (seek) seek.style.display = 'block';
                if (time) time.style.display = 'inline';
                trackEl.classList.add('playing');
                showMiniPlayer();
            }
            toggleMiniPlayerPlay();
            return;
        }

        if (currentTrackElement) {
            const prevSeek = currentTrackElement.querySelector('.track-seek-inline');
            const prevTime = currentTrackElement.querySelector('.track-current-time');
            const prevBtn = currentTrackElement.querySelector('.track-play-btn i');
            if (prevSeek) prevSeek.style.display = 'none';
            if (prevTime) prevTime.style.display = 'none';
            if (prevBtn) prevBtn.className = 'fa-solid fa-play';
            currentTrackElement.classList.remove('playing');
            currentAudio.pause();
        }

        currentAudio.src = fileSrc;
        currentAudio.load();

        trackEl.classList.add('playing');
        const playBtn = trackEl.querySelector('.track-play-btn i');
        if (playBtn) playBtn.className = 'fa-solid fa-pause';

        const seekBar = trackEl.querySelector('.track-seek-inline');
        const currentTimeEl = trackEl.querySelector('.track-current-time');
        const durationEl = trackEl.querySelector('.track-duration');

        if (seekBar) seekBar.style.display = 'block';
        if (currentTimeEl) currentTimeEl.style.display = 'inline';
        if (durationEl) durationEl.textContent = formatTime(duration);

        const updateProgress = () => {
            if (!currentAudio.duration) return;
            const value = (currentAudio.currentTime / currentAudio.duration) * 100;
            seekBar.value = value;
            currentTimeEl.textContent = formatTime(currentAudio.currentTime);
            updateMiniPlayer();
        };

        currentAudio.removeEventListener('timeupdate', updateProgress);
        currentAudio.addEventListener('timeupdate', updateProgress);

        currentAudio.addEventListener('ended', () => {
            const btn = trackEl.querySelector('.track-play-btn i');
            if (btn) btn.className = 'fa-solid fa-play';
            if (seekBar) seekBar.style.display = 'none';
            if (currentTimeEl) currentTimeEl.style.display = 'none';
            trackEl.classList.remove('playing');
            currentTrackElement = null;
            hideMiniPlayer();
        });

        currentAudio.play().catch(() => {});

        currentTrackElement = trackEl;
        const playlistItem = trackEl.closest('.music-playlist-item');
        currentPlaylistCover = playlistItem?.querySelector('.playlist-thumb img')?.src || '';
        miniPlayerCover.src = currentPlaylistCover;
        miniPlayerTrackName.textContent = trackEl.querySelector('.track-name').textContent;

        miniPlayerDurationTime.textContent = formatTime(duration);

        showMiniPlayer();
        toggleMiniPlayerPlay();
    };

    const getDuration = async (src) => {
        return new Promise(resolve => {
            const audio = new Audio();
            audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
            audio.addEventListener('error', () => resolve(0));
            audio.src = src;
        });
    };

    for (const playlist of game.music) {
        const playlistEl = document.createElement('div');
        playlistEl.className = 'music-playlist-item no-select';

        playlistEl.innerHTML = `
            <div class="playlist-header">
                <div class="playlist-thumb">
                    <img src="assets/pages/games/${gameKey}/music/${playlist.cover}" alt="Обложка">
                </div>
                <div class="playlist-info">
                    <h4 class="playlist-name">${playlist.name}</h4>
                    <p class="playlist-duration">загрузка...</p>
                </div>
                <div class="playlist-toggle">
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
            </div>
            <div class="playlist-tracks">
                <ul class="tracks-list"></ul>
            </div>
        `;

        container.appendChild(playlistEl);

        const header = playlistEl.querySelector('.playlist-header');
        const tracks = playlistEl.querySelector('.playlist-tracks');
        const icon = playlistEl.querySelector('.playlist-toggle i');
        const tracksList = playlistEl.querySelector('.tracks-list');
        const durationEl = playlistEl.querySelector('.playlist-duration');

        let totalDuration = 0;

        const loadDurations = async () => {
            const durationPromises = playlist.tracks.map(async (track) => {
                const fileSrc = `assets/pages/games/${gameKey}/music/files/${track.file}`;
                const duration = await getDuration(fileSrc);
                return duration;
            });

            const durations = await Promise.all(durationPromises);
            totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
            durationEl.textContent = formatTime(totalDuration);
        };

        loadDurations();

        const loadTracks = async (playlist, gameKey, tracksList) => {
            for (const [index, track] of playlist.tracks.entries()) {
                const fileSrc = `assets/pages/games/${gameKey}/music/files/${track.file}`;
                const duration = await getDuration(fileSrc);

                const li = document.createElement('li');
                li.className = 'track-item';
                li.dataset.file = fileSrc;
                li.innerHTML = `
                    <span class="track-number">${index + 1}.</span>
                    <span class="track-name">${track.title}</span>
                    <span class="track-current-time">0:00</span>
                    <input type="range" class="track-seek-inline" value="0" min="0" max="100" step="1">
                    <span class="track-duration">${formatTime(duration)}</span>
                    <button class="track-play-btn">
                        <i class="fa-solid fa-play"></i>
                    </button>
                `;
                tracksList.appendChild(li);

                const seekBar = li.querySelector('.track-seek-inline');
                const playBtn = li.querySelector('.track-play-btn');

                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playTrack(li, fileSrc, duration);
                });

                seekBar.addEventListener('pointerdown', () => {
                    isSeeking = true;
                });

                seekBar.addEventListener('pointerup', () => {
                    setTimeout(() => {
                        isSeeking = false;
                    }, 100);
                });

                seekBar.addEventListener('input', () => {
                    if (!currentAudio.duration) return;
                    const time = (seekBar.value / 100) * currentAudio.duration;
                    currentAudio.currentTime = time;
                });

                li.addEventListener('click', () => {
                    playTrack(li, fileSrc, duration);
                });
            }

            if (tracks.classList.contains('open')) {
                requestAnimationFrame(() => {
                    tracks.style.height = tracks.scrollHeight + 'px';
                });
            }
        };

        header.addEventListener('click', (e) => {
            if (e.target.closest('.track-play-btn') || e.target.closest('.track-item')) {
                return;
            }

            if (e.target.classList.contains('track-seek-inline')) {
                return;
            }

            const isOpen = tracks.classList.contains('open');

            if (isOpen) {
                tracks.style.height = tracks.scrollHeight + 'px';
                tracks.classList.remove('open');
                requestAnimationFrame(() => {
                    tracks.style.height = '0';
                });
                icon.className = 'fa-solid fa-chevron-down';

                if (currentTrackElement && currentTrackElement.closest('.playlist-tracks') === tracks) {
                    currentAudio.pause();
                    const prevBtn = currentTrackElement.querySelector('.track-play-btn i');
                    const prevSeek = currentTrackElement.querySelector('.track-seek-inline');
                    const prevTime = currentTrackElement.querySelector('.track-current-time');
                    if (prevBtn) prevBtn.className = 'fa-solid fa-play';
                    if (prevSeek) prevSeek.style.display = 'none';
                    if (prevTime) prevTime.style.display = 'none';
                    currentTrackElement.classList.remove('playing');
                    currentTrackElement = null;
                    hideMiniPlayer();
                }
            } else {
                if (!tracks.dataset.loaded) {
                    loadTracks(playlist, gameKey, tracksList);
                    tracks.dataset.loaded = 'true';
                }

                tracks.classList.add('open');
                tracks.style.height = '0';
                requestAnimationFrame(() => {
                    const height = tracks.scrollHeight + 'px';
                    tracks.style.height = height;
                });
                icon.className = 'fa-solid fa-chevron-up';
            }

            tracks.addEventListener('transitionend', () => {
                if (!tracks.classList.contains('open')) {
                    tracks.style.height = '0';
                }
            }, { once: true });
        });
    }

    miniPlayerPlay.addEventListener('click', () => {
        if (currentAudio.paused) {
            currentAudio.play().catch(() => {});
        } else {
            currentAudio.pause();
        }
        toggleMiniPlayerPlay();
    });

    miniPlayerSeek.addEventListener('pointerdown', () => {
        isSeeking = true;
    });

    miniPlayerSeek.addEventListener('pointerup', () => {
        isSeeking = false;
        const time = (miniPlayerSeek.value / 100) * currentAudio.duration;
        currentAudio.currentTime = time;
    });

    miniPlayerSeek.addEventListener('input', () => {
        if (isSeeking && currentAudio.duration) {
            const time = (miniPlayerSeek.value / 100) * currentAudio.duration;
            currentAudio.currentTime = time;
        }
    });

    miniPlayerClose.addEventListener('click', () => {
        if (currentTrackElement) {
            currentAudio.pause();
            const btn = currentTrackElement.querySelector('.track-play-btn i');
            const seek = currentTrackElement.querySelector('.track-seek-inline');
            const time = currentTrackElement.querySelector('.track-current-time');
            if (btn) btn.className = 'fa-solid fa-play';
            if (seek) seek.style.display = 'none';
            if (time) time.style.display = 'none';
            currentTrackElement.classList.remove('playing');
            currentTrackElement = null;
        }
        hideMiniPlayer();
    });

    const checkTrackVisibility = () => {
        if (!currentTrackElement) return;
        const rect = currentTrackElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (isVisible) {
            hideMiniPlayer();
        } else {
            showMiniPlayer();
        }
    };

    currentAudio.addEventListener('timeupdate', () => {
        updateMiniPlayer();
        checkTrackVisibility();
    });

    window.addEventListener('scroll', checkTrackVisibility, { passive: true });
    window.addEventListener('resize', checkTrackVisibility);
});
