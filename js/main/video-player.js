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
    this.controls = document.getElementById('video-controls') || document.querySelector('.video-controls');
    this.prevTrailerBtn = document.getElementById('prev-trailer');
    this.nextTrailerBtn = document.getElementById('next-trailer');
    this.fullscreenContainer = document.getElementById('video-fullscreen-container');
    this.mobilePlayOverlay = document.getElementById('mobile-play-overlay');
    this.rotateHint = document.getElementById('rotate-hint-overlay');

    this.hideControlsTimeout = null;

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
      this.controls = document.getElementById('video-controls') || document.querySelector('.video-controls');
      this.prevTrailerBtn = document.getElementById('prev-trailer');
      this.nextTrailerBtn = document.getElementById('next-trailer');
      this.fullscreenContainer = document.getElementById('video-fullscreen-container');
      this.mobilePlayOverlay = document.getElementById('mobile-play-overlay');
      this.rotateHint = document.getElementById('rotate-hint-overlay');

      if (this.modal && this.video && this.fullscreenContainer) {
        observer.disconnect();
        this.initEvents();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  initEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.video.addEventListener('click', () => this.togglePlay());
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());

    this.video.addEventListener('play', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      this.showControls();
    });

    this.video.addEventListener('pause', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    this.video.addEventListener('timeupdate', () => {
      const value = (this.video.currentTime / this.video.duration) || 0;
      this.progressBar.value = value;
      this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    });

    this.video.addEventListener('loadedmetadata', () => {
      this.durationEl.textContent = this.formatTime(this.video.duration);
    });

    this.progressBar.addEventListener('input', () => {
      this.video.currentTime = this.video.duration * this.progressBar.value;
    });

    this.muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.updateMuteIcon();
    });

    this.volumeBar.addEventListener('input', () => {
      this.video.volume = this.volumeBar.value;
      this.video.muted = this.volumeBar.value == 0;
      this.updateMuteIcon();
    });

    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    document.addEventListener('mousemove', () => this.handleMouseMove());
    document.addEventListener('touchstart', () => this.handleMouseMove(), { passive: true });
    document.addEventListener('touchmove', () => this.handleMouseMove(), { passive: true });
    document.addEventListener('keydown', () => this.showControls());

    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());

    window.addEventListener('orientationchange', () => this.handleOrientation());
    window.addEventListener('resize', () => this.handleOrientation());

    this.updateMuteIcon();
    this.volumeBar.value = 0.8;
    this.video.volume = 0.8;

    if (this.mobilePlayOverlay) {
      this.mobilePlayOverlay.addEventListener('click', () => {
        this.video.play().catch(() => {});
        this.mobilePlayOverlay.style.display = 'none';
      });
    }
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

    this.controls.classList.remove('hidden');
    this.fullscreenContainer.classList.remove('hide-cursor');

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
        this.fullscreenContainer.requestFullscreen()
          .then(() => this.enterLandscape())
          .catch(e => {
            console.warn("Fullscreen failed:", e);
            this.handleMobileFullscreenFallback(true);
            this.handleOrientation();
          });
      } else if (this.fullscreenContainer.webkitRequestFullscreen) {
        this.fullscreenContainer.webkitRequestFullscreen();
        this.enterLandscape();
      } else {
        this.handleMobileFullscreenFallback(true);
        this.handleOrientation();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        this.handleMobileFullscreenFallback(false);
      }
      this.exitLandscape();
    }
  }

  isFullscreen() {
    return !!document.fullscreenElement ||
           !!document.webkitFullscreenElement ||
           this.fullscreenContainer.classList.contains('mobile-fullscreen');
  }

  handleMobileFullscreenFallback(enable) {
    if (enable) {
      this.fullscreenContainer.classList.add('mobile-fullscreen');
      document.body.style.overflow = 'hidden';
    } else {
      this.fullscreenContainer.classList.remove('mobile-fullscreen');
      document.body.style.overflow = '';
    }
    this.onFullscreenChange();
  }

  onFullscreenChange() {
    const isFullscreen = this.isFullscreen();
    const icon = isFullscreen ? 'fa-compress' : 'fa-expand';
    this.fullscreenBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    this.showControls();
    this.handleOrientation();
  }

  enterLandscape() {
    if ('orientation' in screen) {
      screen.orientation.lock('landscape').catch(() => {
        this.handleOrientation();
      });
    } else {
      this.handleOrientation();
    }
  }

  exitLandscape() {
    if ('orientation' in screen) {
      screen.orientation.unlock();
    }
    this.hideRotateHint();
  }

  handleOrientation() {
    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isMobile && this.modal.classList.contains('active')) {
      if (isPortrait && !this.isFullscreen()) {
        this.showRotateHint();
      } else {
        this.hideRotateHint();
      }
    } else {
      this.hideRotateHint();
    }
  }

  showRotateHint() {
    if (this.rotateHint) {
      this.rotateHint.style.display = 'flex';
    }
  }

  hideRotateHint() {
    if (this.rotateHint) {
      this.rotateHint.style.display = 'none';
    }
  }

  play(src, poster = '', title = 'Видео', gameId = null, showNav = false) {
    this.video.src = src;
    this.video.poster = poster;

    this.prevTrailerBtn.style.display = showNav ? 'flex' : 'none';
    this.nextTrailerBtn.style.display = showNav ? 'flex' : 'none';

    this.modal.classList.add('active');
    this.video.load();

    this.video.onloadedmetadata = () => {
      this.durationEl.textContent = this.formatTime(this.video.duration);
      this.progressBar.value = 0;
      this.currentTimeEl.textContent = '00:00';
    };

    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    this.showControls();
    this.handleOrientation();
  }

  close() {
    if (document.exitFullscreen) document.exitFullscreen();
    if (document.webkitExitFullscreen) document.webkitExitFullscreen();

    this.handleMobileFullscreenFallback(false);
    this.exitLandscape();

    this.video.pause();
    this.video.currentTime = 0;
    this.modal.classList.remove('active');
    this.clearHideTimeout();
    this.video.src = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.videoPlayer = new VideoPlayer();
});
