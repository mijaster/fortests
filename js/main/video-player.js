class VideoPlayer {
  constructor() {
    this.modal = document.getElementById('video-modal');
    this.video = document.getElementById('video-player');
    this.closeBtn = document.getElementById('video-modal-close');
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.progressBar = document.getElementById('progress-bar');
    this.currentTimeEl = document.getElementById('current-time');
    this.durationEl = document.getElementById('duration');
    this.muteBtn = document.getElementById('mute-btn');
    this.volumeBar = document.getElementById('volume-bar');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.titleElement = document.getElementById('video-title');
    this.gamePageLink = document.getElementById('game-page-link');
    this.controls = document.getElementById('video-controls') || document.querySelector('.video-controls');
    this.overlayTop = document.getElementById('video-overlay-top') || document.querySelector('.video-overlay-top');
    this.prevTrailerBtn = document.getElementById('prev-trailer');
    this.nextTrailerBtn = document.getElementById('next-trailer');
    this.fullscreenContainer = document.getElementById('video-fullscreen-container');

    this.hideControlsTimeout = null;

    // Если элементы не найдены сразу — ждём
    if (!this.modal || !this.video) {
      this.waitForElements();
      return;
    }

    this.initEvents();
  }

  waitForElements() {
    const observer = new MutationObserver(() => {
      this.modal = document.getElementById('video-modal');
      this.video = document.getElementById('video-player');
      this.closeBtn = document.getElementById('video-modal-close');
      this.playPauseBtn = document.getElementById('play-pause-btn');
      this.progressBar = document.getElementById('progress-bar');
      this.currentTimeEl = document.getElementById('current-time');
      this.durationEl = document.getElementById('duration');
      this.muteBtn = document.getElementById('mute-btn');
      this.volumeBar = document.getElementById('volume-bar');
      this.fullscreenBtn = document.getElementById('fullscreen-btn');
      this.titleElement = document.getElementById('video-title');
      this.gamePageLink = document.getElementById('game-page-link');
      this.controls = document.getElementById('video-controls') || document.querySelector('.video-controls');
      this.overlayTop = document.getElementById('video-overlay-top') || document.querySelector('.video-overlay-top');
      this.prevTrailerBtn = document.getElementById('prev-trailer');
      this.nextTrailerBtn = document.getElementById('next-trailer');
      this.fullscreenContainer = document.getElementById('video-fullscreen-container');

      if (this.modal && this.video && this.fullscreenContainer) {
        observer.disconnect();
        this.initEvents();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  initEvents() {
    // Закрытие по крестику или клику вне видео
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Управление воспроизведением
    this.video.addEventListener('click', () => this.togglePlay());
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());

    this.video.addEventListener('play', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      this.showControls();
    });

    this.video.addEventListener('pause', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    // Обновление прогресса
    this.video.addEventListener('timeupdate', () => {
      const value = (this.video.currentTime / this.video.duration) || 0;
      this.progressBar.value = value;
      this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    });

    this.video.addEventListener('loadedmetadata', () => {
      this.durationEl.textContent = this.formatTime(this.video.duration);
    });

    // Перемотка
    this.progressBar.addEventListener('input', () => {
      this.video.currentTime = this.video.duration * this.progressBar.value;
    });

    // Мут и громкость
    this.muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.updateMuteIcon();
    });

    this.volumeBar.addEventListener('input', () => {
      this.video.volume = this.volumeBar.value;
      this.video.muted = this.volumeBar.value == 0;
      this.updateMuteIcon();
    });

    // Полноэкранный режим
    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Показываем контролы при движении мыши
    document.addEventListener('mousemove', () => this.handleMouseMove());
    document.addEventListener('keydown', () => this.showControls());

    // Слежение за полноэкранным режимом
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());

    // Инициализация
    this.updateMuteIcon();
    this.volumeBar.value = 0.8;
    this.video.volume = 0.8;
  }

  updateMuteIcon() {
    const icon = this.video.muted ? 'fa-volume-mute' : 'fa-volume-up';
    this.muteBtn.innerHTML = `<i class="fas ${icon}"></i>`;
  }

  handleMouseMove() {
    this.showControls();
  }

  showControls() {
    const isFullscreen = this.isFullscreen();

    // Скрываем название и кнопку в полноэкранном режиме
    if (isFullscreen) {
      this.overlayTop.style.display = 'none';
    } else {
      this.overlayTop.style.display = '';
    }

    // Показываем панель управления
    this.controls.classList.remove('hidden');
    this.fullscreenContainer.classList.remove('hide-cursor');

    // Скрываем через 2 секунды, если видео не на паузе
    this.clearHideTimeout();
    this.hideControlsTimeout = setTimeout(() => {
      if (!this.video.paused) {
        this.controls.classList.add('hidden');
        this.fullscreenContainer.classList.add('hide-cursor');
      }
    }, 2000);
  }

  clearHideTimeout() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = null;
    }
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play().catch(() => {});
    } else {
      this.video.pause();
    }
    this.showControls();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleFullscreen() {
    const isFullscreen = this.isFullscreen();

    if (!isFullscreen) {
      if (this.fullscreenContainer.requestFullscreen) {
        this.fullscreenContainer.requestFullscreen();
      } else if (this.fullscreenContainer.webkitRequestFullscreen) {
        this.fullscreenContainer.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  isFullscreen() {
    return !!document.fullscreenElement || !!document.webkitFullscreenElement;
  }

  onFullscreenChange() {
    const isFullscreen = this.isFullscreen();
    const icon = isFullscreen ? 'fa-compress' : 'fa-expand';
    this.fullscreenBtn.innerHTML = `<i class="fas ${icon}"></i>`;

    if (isFullscreen) {
      this.overlayTop.style.display = 'none';
    } else {
      this.overlayTop.style.display = '';
    }

    this.showControls();
  }

  play(src, poster = '', title = 'Видео', gameId = null, showNav = false) {
    // Устанавливаем источник и постер
    this.video.src = src;
    this.video.poster = poster;
    this.titleElement.textContent = title;

    // Показываем кнопку "На страницу игры", если нужно
    const isOnGameSingle = window.location.pathname.includes('game-single.html');
    this.gamePageLink.style.display = gameId && !isOnGameSingle ? 'inline-block' : 'none';
    if (gameId && !isOnGameSingle) {
      this.gamePageLink.href = `game-single.html?id=${gameId}`;
    }

    // Кнопки навигации
    this.prevTrailerBtn.style.display = showNav ? 'flex' : 'none';
    this.nextTrailerBtn.style.display = showNav ? 'flex' : 'none';

    // Загружаем видео
    this.video.load();
    this.modal.classList.add('active');

    // Сбрасываем прогресс
    this.video.onloadedmetadata = () => {
      this.durationEl.textContent = this.formatTime(this.video.duration);
    };

    this.progressBar.value = 0;
    this.currentTimeEl.textContent = '00:00';
    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

    // Показываем верхнюю панель (в обычном режиме)
    this.overlayTop.style.display = '';

    // Показываем контролы
    this.showControls();
  }

  close() {
    // Выходим из полноэкранного режима
    if (document.exitFullscreen) document.exitFullscreen();
    if (document.webkitExitFullscreen) document.webkitExitFullscreen();

    // Останавливаем видео
    this.video.pause();
    this.video.currentTime = 0;
    this.modal.classList.remove('active');

    // Сбрасываем таймер
    this.clearHideTimeout();

    // Очищаем источник (чтобы не грузилось в фоне)
    this.video.src = '';
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.videoPlayer = new VideoPlayer();
});
