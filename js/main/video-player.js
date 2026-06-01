class VideoPlayer {
  constructor() {
    this._scrollLockY = 0;
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
    this.videoContainer = document.querySelector('.video-container');
    this.mobilePlayOverlay = document.getElementById('mobile-play-overlay');
    this.rotateHint = document.getElementById('rotate-hint-overlay');
    this.endOverlay = document.getElementById('video-end-overlay');
    this.endOverlayCover = document.getElementById('video-end-overlay-cover');
    this.endOverlayTitle = document.getElementById('video-end-overlay-title');
    this.endOverlayButton = document.getElementById('video-end-overlay-button');
    this.currentGameId = null;
    this.currentGameName = '';
    this.currentVideoTitle = '';
    this.currentPoster = '';

    this.hideControlsTimeout = null;

    if (!this.modal || !this.video) {
      this.waitForElements();
      return;
    }

    this.initEvents();
  }

  isMobileDevice() {
    try {
      const ua = navigator.userAgent || '';
      const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 768;
      const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
      return touch && (mobileUA || smallScreen);
    } catch (e) {
      return false;
    }
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
      this.videoContainer = document.querySelector('.video-container');
      this.mobilePlayOverlay = document.getElementById('mobile-play-overlay');
      this.rotateHint = document.getElementById('rotate-hint-overlay');
      this.endOverlay = document.getElementById('video-end-overlay');
      this.endOverlayCover = document.getElementById('video-end-overlay-cover');
      this.endOverlayTitle = document.getElementById('video-end-overlay-title');
      this.endOverlayButton = document.getElementById('video-end-overlay-button');

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

    // On mobile, tapping the video toggles play/pause inside the already opened fullscreen modal.
    this.video.addEventListener('click', () => {
      this.togglePlay();
    });
    // Prevent duplicate handlers on touch devices
    this.video.addEventListener('touchend', (e) => {
      e.stopPropagation();
    }, { passive: true });
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());

    this.video.addEventListener('play', () => {
      this.hideEndOverlay();
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      if (this.videoContainer) this.videoContainer.classList.remove('paused');
      this.showControls();
    });

    this.video.addEventListener('pause', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      if (this.videoContainer && !this.video.ended) this.videoContainer.classList.add('paused');
      this.showControls();
      if (this.fullscreenContainer) {
        this.fullscreenContainer.classList.remove('hide-left');
        this.fullscreenContainer.classList.add('controls-visible');
      }
    });

    this.video.addEventListener('ended', () => {
      if (this.videoContainer) this.videoContainer.classList.remove('paused');
    });

    this.video.addEventListener('timeupdate', () => {
      const value = (this.video.currentTime / this.video.duration) || 0;
      this.progressBar.value = value;
      this.progressBar.style.setProperty('--progress', (value * 100).toFixed(2));
      this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    });

    this.video.addEventListener('loadedmetadata', () => {
      this.durationEl.textContent = this.formatTime(this.video.duration);
    });

    this.progressBar.addEventListener('input', () => {
      this.video.currentTime = this.video.duration * this.progressBar.value;
      this.progressBar.style.setProperty('--progress', (this.progressBar.value * 100).toFixed(2));
    });

    this.muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.updateMuteIcon();
    });

    this.volumeBar.addEventListener('input', () => {
      this.video.volume = this.volumeBar.value;
      this.video.muted = this.volumeBar.value == 0;
      this.updateMuteIcon();
      this.volumeBar.style.setProperty('--volume-progress', (this.volumeBar.value * 100).toFixed(2));
    });

    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('touchstart', (e) => this.handleMouseMove(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleMouseMove(e), { passive: true });
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    if (this.endOverlayButton) {
      this.endOverlayButton.addEventListener('click', (e) => {
        if (!this.currentGameId) {
          e.preventDefault();
        }
      });
    }

    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());

    window.addEventListener('orientationchange', () => this.handleOrientation());
    window.addEventListener('resize', () => this.handleOrientation());

    this.updateMuteIcon();
    this.volumeBar.value = 1;
    this.video.volume = 1;
    this.volumeBar.style.setProperty('--volume-progress', '100');

    // Adjust visible controls after initialization
    this.applyMobileControlVisibility();

  }

  applyMobileControlVisibility() {
    try {
      if (this.isMobileDevice()) {
        if (this.playPauseBtn) this.playPauseBtn.style.display = 'none';
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = 'none';
      } else {
        if (this.playPauseBtn) this.playPauseBtn.style.display = '';
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = '';
      }
    } catch (e) {
      // silent
    }
  }

  updateMuteIcon() {
    const icon = this.video.muted ? 'fa-volume-mute' : 'fa-volume-up';
    this.muteBtn.innerHTML = `<i class="fas ${icon}"></i>`;
  }

  handleMouseMove(e) {
    const isFs = this.isFullscreen();

    let x = null;
    if (e) {
      if (typeof e.clientX === 'number') x = e.clientX;
      else if (e.touches && e.touches[0]) x = e.touches[0].clientX;
      else if (e.changedTouches && e.changedTouches[0]) x = e.changedTouches[0].clientX;
    }

    // If in fullscreen and we have coordinates, hide controls when cursor is on left side
    if (isFs && x !== null) {
      const threshold = Math.min(5, Math.floor(window.innerWidth * 0.18));
      if (x < threshold) {
        if (this.controls) this.controls.classList.add('hidden');
        if (this.fullscreenContainer) {
          this.fullscreenContainer.classList.remove('controls-visible');
          this.fullscreenContainer.classList.add('hide-left');
        }
        this.clearHideTimeout();
        return;
      } else {
        if (this.fullscreenContainer) this.fullscreenContainer.classList.remove('hide-left');
      }
    }

    this.showControls();
  }

  showControls() {
    const isFullscreen = this.isFullscreen();

    this.controls.classList.remove('hidden');
    if (this.fullscreenContainer) this.fullscreenContainer.classList.add('controls-visible');
    this.fullscreenContainer.classList.remove('hide-cursor');

    this.clearHideTimeout();
    if (isFullscreen) {
      this.hideControlsTimeout = setTimeout(() => {
        if (!this.video.paused) {
          this.controls.classList.add('hidden');
          if (this.fullscreenContainer) this.fullscreenContainer.classList.remove('controls-visible');
          this.fullscreenContainer.classList.add('hide-cursor');
        }
      }, 2000);
    }
  }

  clearHideTimeout() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = null;
    }
  }

  showEndOverlay() {
    if (!this.endOverlay) return;

    this.video.classList.add('video-ended');
    this.endOverlay.classList.add('active');

    if (this.endOverlayCover) {
      if (this.currentPoster) {
        this.endOverlayCover.src = this.currentPoster;
        this.endOverlayCover.alt = `${this.currentGameName || this.currentVideoTitle || 'Игра'} — обложка`;
        this.endOverlayCover.style.display = 'block';
      } else {
        this.endOverlayCover.style.display = 'none';
      }
    }

    if (this.endOverlayTitle) {
      this.endOverlayTitle.textContent = this.currentGameName || this.currentVideoTitle || 'Видео закончилось';
    }

    if (this.endOverlayButton) {
      if (this.currentGameId) {
        this.endOverlayButton.href = `game-single.html?id=${this.currentGameId}`;
        this.endOverlayButton.style.display = 'inline-flex';
      } else {
        this.endOverlayButton.style.display = 'none';
      }
    }
  }

  hideEndOverlay() {
    if (this.endOverlay) {
      this.endOverlay.classList.remove('active');
    }
    this.video.classList.remove('video-ended');
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
    if (this.isMobileDevice()) {
      return;
    }

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
      if (this.isMobileDevice()) {
        this.enterLandscape();
      }
    } else {
      this.fullscreenContainer.classList.remove('mobile-fullscreen');
      document.body.style.overflow = '';
    }
    // Apply rotation class for fallback on mobile
    if (this.isMobileDevice()) {
      if (enable) this.fullscreenContainer.classList.add('mobile-rotated');
      else this.fullscreenContainer.classList.remove('mobile-rotated');
    }
    this.onFullscreenChange();
  }

  onFullscreenChange() {
    const isFullscreen = this.isFullscreen();
    const icon = isFullscreen ? 'fa-compress' : 'fa-expand';
    this.fullscreenBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    this.showControls();
    this.handleOrientation();
    // Re-apply control visibility in case device/orientation changed
    this.applyMobileControlVisibility();
    // On mobile devices, when entering fullscreen ensure rotated layout for landscape
    if (this.isMobileDevice()) {
      if (isFullscreen) {
        this.fullscreenContainer.classList.add('mobile-rotated');
      } else {
        this.fullscreenContainer.classList.remove('mobile-rotated');
      }
    }
    // keep controls-visible state; showControls() handles adding/removing classes
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

    // Also update control visibility when orientation/size changes
    this.applyMobileControlVisibility();
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

  play(src, poster = '', title = 'Видео', gameId = null, showNav = false, gameName = '') {
    this.currentGameId = gameId;
    this.currentGameName = gameName;
    this.currentVideoTitle = title;
    this.currentPoster = poster;

    this.video.src = src;
    this.video.poster = poster;

    if (this.endOverlayCover) {
      this.endOverlayCover.src = poster || '';
      this.endOverlayCover.alt = `${gameName || title || 'Игра'} — обложка`;
    }

    if (this.endOverlayTitle) {
      this.endOverlayTitle.textContent = gameName || title || 'Видео';
    }

    if (this.endOverlayButton) {
      if (gameId) {
        this.endOverlayButton.href = `game-single.html?id=${gameId}`;
        this.endOverlayButton.style.display = 'inline-flex';
      } else {
        this.endOverlayButton.style.display = 'none';
      }
    }

    this.hideEndOverlay();

    this.prevTrailerBtn.style.display = showNav ? 'flex' : 'none';
    this.nextTrailerBtn.style.display = showNav ? 'flex' : 'none';

    this.lockBodyScroll();
    this.modal.classList.add('active');
    this.video.load();

    if (this.videoContainer) {
      this.videoContainer.classList.add('paused');
    }

    if (this.isMobileDevice()) {
      this.fullscreenContainer.classList.remove('mobile-fullscreen', 'mobile-rotated');
    }

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
    if (this.videoContainer) this.videoContainer.classList.remove('paused');
    this.modal.classList.remove('active');
    this.clearHideTimeout();
    this.hideEndOverlay();
    this.video.src = '';
    this.unlockBodyScroll();
  }

  lockBodyScroll() {
    try {
      this._scrollLockY = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this._scrollLockY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } catch (e) {
      console.warn('Failed to lock body scroll', e);
    }
  }

  unlockBodyScroll() {
    try {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, this._scrollLockY || 0);
    } catch (e) {
      console.warn('Failed to unlock body scroll', e);
    }
  }

  handleKeydown(e) {
    if (!this.modal.classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let handled = false;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlay();
        handled = true;
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.video.currentTime = Math.max(0, this.video.currentTime - 5);
        handled = true;
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.video.currentTime = Math.min(this.video.duration || Infinity, this.video.currentTime + 5);
        handled = true;
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        this.video.muted = (this.video.volume === 0);
        this.volumeBar.value = this.video.volume;
        this.volumeBar.style.setProperty('--volume-progress', (this.video.volume * 100).toFixed(2));
        this.updateMuteIcon();
        handled = true;
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        this.video.muted = (this.video.volume === 0);
        this.volumeBar.value = this.video.volume;
        this.volumeBar.style.setProperty('--volume-progress', (this.video.volume * 100).toFixed(2));
        this.updateMuteIcon();
        handled = true;
        break;

      case 'KeyM':
        e.preventDefault();
        this.video.muted = !this.video.muted;
        this.updateMuteIcon();
        handled = true;
        break;

      case 'KeyF':
        e.preventDefault();
        this.toggleFullscreen();
        handled = true;
        break;

      case 'Escape':
        if (this.isFullscreen()) {
          // show controls before exiting fullscreen so user sees them
          this.showControls();
          if (this.fullscreenContainer) {
            this.fullscreenContainer.classList.remove('hide-left');
            this.fullscreenContainer.classList.add('controls-visible');
          }
          this.toggleFullscreen();
        } else {
          this.close();
        }
        handled = true;
        break;
    }

    if (handled) {
      this.showControls();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.videoPlayer = new VideoPlayer();
});