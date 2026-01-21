document.addEventListener('DOMContentLoaded', async () => {
  const videoContainer = document.getElementById('trailers-container');
  const trailersSection = document.getElementById('trailers-section');
  if (!videoContainer) return;

  let trailers = [];
  let gameId = null;

  try {
    const response = await fetch('json/games.json');
    const games = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    gameId = urlParams.get('id');

    if (!gameId || !games.projects || !games.projects[gameId]) {
      trailersSection.style.display = 'none';
      return;
    }

    const game = games.projects[gameId];
    if (game.trailers) {
      trailers = game.trailers.filter(trailer => trailer.addToSinglePage === true);
    }
  } catch (error) {
    console.error('Ошибка загрузки или парсинга games.json:', error);
    trailersSection.style.display = 'none';
    return;
  }

  if (trailers.length === 0) {
    trailersSection.style.display = 'none';
    return;
  }

  trailersSection.style.display = 'block';

  if (!window.videoPlayer) {
    console.warn('Ожидание videoPlayer...');
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (window.videoPlayer) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  function buildVideoPath(file) {
    return `assets/pages/games/${gameId}/trailers/${file}`;
  }

  function buildPreviewPath(preview) {
    return `assets/pages/games/${gameId}/previews/${preview}`;
  }

  function createPoster(videoFile, previewFile = null) {
    return new Promise(resolve => {
      const videoPath = buildVideoPath(videoFile);
      const previewPath = previewFile ? buildPreviewPath(previewFile) : null;

      if (previewPath) {
        const img = new Image();
        img.onload = () => resolve(previewPath);
        img.onerror = () => generateFromVideo(videoPath, resolve);
        img.src = previewPath;
      } else {
        generateFromVideo(videoPath, resolve);
      }
    });
  }

  function generateFromVideo(videoSrc, resolve) {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.onloadeddata = () => {
      video.currentTime = Math.min(3, video.duration * 0.25);
    };

    video.ontimeupdate = () => {
      video.ontimeupdate = null;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth * 0.5;
      canvas.height = video.videoHeight * 0.5;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      cleanup();
      resolve(dataUrl);
    };

    video.onerror = () => {
      cleanup();
      resolve('assets/img/placeholder.jpg');
    };

    video.src = videoSrc;

    function cleanup() {
      video.remove();
      canvas?.remove();
    }
  }

  for (const trailer of trailers) {
    const videoSrc = buildVideoPath(trailer.file);
    const previewSrc = trailer.preview ? buildPreviewPath(trailer.preview) : null;
    const posterUrl = await createPoster(trailer.file, trailer.preview || null);

    const trailerItem = document.createElement('div');
    trailerItem.className = 'trailer-item no-select';
    trailerItem.innerHTML = `
      <div class="trailer-card">
        <img 
          src="${posterUrl}" 
          alt="Обложка: ${trailer.title}" 
          class="trailer-poster" 
          loading="lazy"
        >
        <div class="trailer-overlay">
          <i class="fas fa-play-circle"></i>
        </div>
      </div>
      <p class="trailer-title">${trailer.title}</p>
    `;

    trailerItem.addEventListener('click', () => {
      window.videoPlayer.play(
        videoSrc,
        previewSrc || '',
        trailer.name,
        null,
        false
      );
    });

    videoContainer.appendChild(trailerItem);
  }
});
