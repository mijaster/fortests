document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.querySelector('.video-player');
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const volumeBtn = document.querySelector('.volume-btn');
    const volumeSlider = document.querySelector('.volume-slider');
    const timeline = document.querySelector('.timeline');
    const currentTimeElement = document.querySelector('.current-time');
    const totalTimeElement = document.querySelector('.total-time');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    const videoContainer = document.querySelector('.video-player-container');

    // Play/Pause functionality
    playPauseBtn.addEventListener('click', togglePlay);
    videoPlayer.addEventListener('click', togglePlay);

    function togglePlay() {
        if (videoPlayer.paused) {
            videoPlayer.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            videoPlayer.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    // Volume control
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', setVolume);

    function toggleMute() {
        videoPlayer.muted = !videoPlayer.muted;
        if (videoPlayer.muted) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            volumeSlider.value = 0;
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            volumeSlider.value = videoPlayer.volume * 100;
        }
    }

    function setVolume() {
        videoPlayer.volume = volumeSlider.value / 100;
        if (videoPlayer.volume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Timeline control
    videoPlayer.addEventListener('timeupdate', updateTimeline);
    timeline.addEventListener('input', setCurrentTime);

    function updateTimeline() {
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        timeline.value = percentage;
        
        // Update time display
        currentTimeElement.textContent = formatTime(videoPlayer.currentTime);
        if (!isNaN(videoPlayer.duration)) {
            totalTimeElement.textContent = formatTime(videoPlayer.duration);
        }
    }

    function setCurrentTime() {
        const time = (timeline.value * videoPlayer.duration) / 100;
        videoPlayer.currentTime = time;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            videoContainer.classList.add('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            videoContainer.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // Show controls when mouse moves
    let controlsTimeout;
    videoContainer.addEventListener('mousemove', () => {
        videoContainer.querySelector('.video-controls').style.opacity = '1';
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused) {
                videoContainer.querySelector('.video-controls').style.opacity = '0';
            }
        }, 3000);
    });

    // Initialize
    videoPlayer.addEventListener('loadedmetadata', () => {
        totalTimeElement.textContent = formatTime(videoPlayer.duration);
    });
});