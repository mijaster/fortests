function initVideoPlayers() {
    const videoPlayers = document.querySelectorAll('.video-player');

    videoPlayers.forEach(videoPlayer => {
        const videoElement = videoPlayer.querySelector('video');
        const pausePreview = videoPlayer.querySelector('.pause-preview');
        const pauseIcon = videoPlayer.querySelector('.pause-icon');
        const playPauseBtn = videoPlayer.querySelector('.play-pause-btn');
        const progressSlider = videoPlayer.querySelector('.progress-slider');
        const timeDisplay = videoPlayer.querySelector('.time-display');
        const volumeSlider = videoPlayer.querySelector('.volume-slider');
        const volumeIcon = videoPlayer.querySelector('.volume-icon');
        const fullscreenBtn = videoPlayer.querySelector('.fullscreen-btn');
        const customControls = videoPlayer.querySelector('.custom-controls');
        const videoInfoOverlay = videoPlayer.querySelector('.video-info-overlay');

        function updateTimeDisplay() {
            const currentTime = formatTime(videoElement.currentTime);
            const duration = formatTime(videoElement.duration);
            timeDisplay.textContent = `${currentTime} / ${duration}`;
        }

        function formatTime(time) {
            if (isNaN(time)) return '0:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && 
                !document.mozFullScreenElement && !document.msFullscreenElement) {
                // Вход в полноэкранный режим
                if (videoPlayer.requestFullscreen) {
                    videoPlayer.requestFullscreen();
                } else if (videoPlayer.webkitRequestFullscreen) {
                    videoPlayer.webkitRequestFullscreen();
                } else if (videoPlayer.mozRequestFullScreen) {
                    videoPlayer.mozRequestFullScreen();
                } else if (videoPlayer.msRequestFullscreen) {
                    videoPlayer.msRequestFullscreen();
                }
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                // Выход из полноэкранного режима
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }

        function handleFullscreenChange() {
            if (document.fullscreenElement || document.webkitFullscreenElement || 
                document.mozFullScreenElement || document.msFullscreenElement) {
                videoPlayer.classList.add('fullscreen-active');
                customControls.style.opacity = '1';
                videoInfoOverlay.style.opacity = '1';
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                videoPlayer.classList.remove('fullscreen-active');
                customControls.style.opacity = '';
                videoInfoOverlay.style.opacity = '';
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Добавляем обработчик нажатия клавиши ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoPlayer.classList.contains('fullscreen-active')) {
                toggleFullscreen();
            }
        });

        videoElement.addEventListener('loadedmetadata', () => {
            updateTimeDisplay();
        });

        videoElement.addEventListener('pause', () => {
            pausePreview.classList.add('visible');
            pauseIcon.classList.add('visible');
        });

        videoElement.addEventListener('play', () => {
            pausePreview.classList.remove('visible');
            pauseIcon.classList.remove('visible');

            videoPlayers.forEach(otherPlayer => {
                const otherVideo = otherPlayer.querySelector('video');
                if (otherVideo !== videoElement && !otherVideo.paused) {
                    otherVideo.pause();
                    const otherPlayPauseBtn = otherPlayer.querySelector('.play-pause-btn i');
                    otherPlayPauseBtn.classList.remove('fa-pause');
                    otherPlayPauseBtn.classList.add('fa-play');
                }
            });
        });

        playPauseBtn.addEventListener('click', () => {
            if (videoElement.paused) {
                videoElement.play();
                playPauseBtn.querySelector('i').classList.remove('fa-play');
                playPauseBtn.querySelector('i').classList.add('fa-pause');
            } else {
                videoElement.pause();
                playPauseBtn.querySelector('i').classList.remove('fa-pause');
                playPauseBtn.querySelector('i').classList.add('fa-play');
            }
        });

        videoElement.addEventListener('timeupdate', () => {
            const percentage = (videoElement.currentTime / videoElement.duration) * 100;
            progressSlider.value = percentage;
            updateTimeDisplay();
        });

        progressSlider.addEventListener('input', () => {
            const time = (progressSlider.value / 100) * videoElement.duration;
            videoElement.currentTime = time;
        });

        volumeSlider.addEventListener('input', () => {
            videoElement.volume = volumeSlider.value / 100;
            if (videoElement.volume === 0) {
                volumeIcon.classList.remove('fa-volume-up');
                volumeIcon.classList.add('fa-volume-off');
            } else {
                volumeIcon.classList.remove('fa-volume-off');
                volumeIcon.classList.add('fa-volume-up');
            }
        });

        fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Добавляем кнопку закрытия полноэкранного режима
        const closeFullscreenBtn = document.createElement('button');
        closeFullscreenBtn.className = 'close-fullscreen-btn';
        closeFullscreenBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeFullscreenBtn.addEventListener('click', toggleFullscreen);
        videoPlayer.appendChild(closeFullscreenBtn);

        updateTimeDisplay();
    });
}
initVideoPlayers();