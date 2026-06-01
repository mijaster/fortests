document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch('json/games.json');
    if (!response.ok) throw new Error('Не удалось загрузить games.json');

    const data = await response.json();
    const projects = data.projects;

    const isGameSingle = window.location.pathname.endsWith('game-single.html');

    if (isGameSingle) {
      const urlParams = new URLSearchParams(window.location.search);
      const gameId = urlParams.get('id');

      if (!gameId || !projects[gameId]) {
        console.warn('Игра не найдена по ID:', gameId);
        return;
      }

      const project = projects[gameId];
      const container = document.getElementById('featuredTrailersContainer');
      const section = document.getElementById('trailers-section');

      if (!container || !section) {
        console.warn('Контейнер трейлеров не найден на странице game-single');
        return;
      }

      let validTrailers = [];

      if (project.visible && Array.isArray(project.trailers)) {
        for (const trailer of project.trailers) {
          if (
            trailer.addToSinglePage === true &&
            trailer.preview &&
            trailer.title &&
            trailer.file
          ) {
            validTrailers.push({ id: gameId, project, trailer });
          }
        }
      }

      if (validTrailers.length === 0) {
        section.style.display = 'none';
        return;
      }

      container.innerHTML = '';
      for (const item of validTrailers) {
        const el = createFeaturedTrailer(item);
        container.appendChild(el);
      }

      section.style.display = 'block';

      return;
    }

    const allTrailers = [];

    for (const [id, project] of Object.entries(projects)) {
      if (!project.visible || !Array.isArray(project.trailers)) continue;
      for (const trailer of project.trailers) {
        if (!trailer.preview || !trailer.title || !trailer.file) continue;
        if (trailer.addToTrailersPage === false) continue;
        allTrailers.push({ id, project, trailer });
      }
    }

    if (allTrailers.length === 0) {
      const container = document.getElementById('trailersContainer');
      document.body.classList.add('no-trailers-page');
      if (container) {
        container.innerHTML = `
          <div class="no-trailers-card">
            <div class="no-trailers-icon"><i class="fa-solid fa-face-sad-cry"></i></div>
            <h2>Кажется, трейлеров пока нет...</h2>
          </div>
        `;
      }
      return;
    }

    allTrailers.sort((a, b) => {
      const dateA = a.trailer.date ? new Date(a.trailer.date) : new Date(0);
      const dateB = b.trailer.date ? new Date(b.trailer.date) : new Date(0);
      return dateB - dateA;
    });

    const featured = allTrailers[0];
    const featuredEl = createFeaturedTrailer(featured);
    const featuredTarget = document.getElementById('featuredTrailer');
    if (featuredTarget) {
      featuredTarget.replaceWith(featuredEl);
    }

    if (featured && featured.trailer && featured.trailer.preview) {
      applyFeaturedBackground(`assets/pages/games/${featured.id}/previews/${featured.trailer.preview}`);
    }

    const listTrailers = allTrailers.slice(1);
    const listContainer = document.getElementById('trailersContainer');
    if (listContainer) {
      listContainer.innerHTML = '';
      for (const item of listTrailers) {
        const card = createTrailerCard(item);
        listContainer.appendChild(card);
      }
    }

    function createTrailerCard({ id, project, trailer }) {
      const card = document.createElement('div');
      card.className = 'trailer-card';

      const previewContainer = document.createElement('div');
      previewContainer.className = 'preview-container';

      const previewImg = document.createElement('img');
      previewImg.src = `assets/pages/games/${id}/previews/${trailer.preview}`;
      previewImg.alt = trailer.title;
      previewImg.className = 'preview-img';
      previewContainer.appendChild(previewImg);

      const playButton = document.createElement('div');
      playButton.className = 'trailer-play-button';
      playButton.innerHTML = '<i class="fas fa-play"></i>';
      previewContainer.appendChild(playButton);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'card-content';

      const textSection = document.createElement('div');
      textSection.className = 'text-section';

      const titleEl = document.createElement('p');
      titleEl.className = 'trailer-title';
      titleEl.textContent = trailer.title;

      const gameEl = document.createElement('p');
      gameEl.className = 'game-title';
      gameEl.textContent = project.name;

      textSection.appendChild(titleEl);
      textSection.appendChild(gameEl);
      contentDiv.appendChild(textSection);

      card.appendChild(previewContainer);
      card.appendChild(contentDiv);

      const handleClick = () => {
        const trailerSrc = `assets/pages/games/${id}/trailers/${trailer.file}`;
        const posterSrc = trailer.preview
          ? `assets/pages/games/${id}/previews/${trailer.preview}`
          : project.poster
            ? `assets/pages/games/${id}/${project.poster}`
            : '';
        const trailerTitle = trailer.title || 'Трейлер';
        window.videoPlayer.play(trailerSrc, posterSrc, trailerTitle, id, false, project.name);
      };

      previewImg.addEventListener('click', handleClick);
      playButton.addEventListener('click', handleClick);

      return card;
    }

    function formatDuration(seconds) {
      const rounded = Math.floor(seconds);
      const minutes = Math.floor(rounded / 60);
      const secs = rounded % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function loadTrailerDuration(src, durationElement) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.muted = true;
      videoElement.src = src;
      videoElement.addEventListener('loadedmetadata', () => {
        if (videoElement.duration && !Number.isNaN(videoElement.duration) && videoElement.duration !== Infinity) {
          durationElement.innerHTML = `<i class="fa-solid fa-video"></i> ${formatDuration(videoElement.duration)}`;
        }
      }, { once: true });
      videoElement.addEventListener('error', () => {
        durationElement.innerHTML = `<i class="fa-solid fa-video"></i> 00:00`;
      }, { once: true });
    }

    function brightenColor(rgb, factor = 2, minBoost = 15) {
      return {
        r: Math.min(255, Math.round(Math.max(rgb.r * factor, rgb.r + minBoost))),
        g: Math.min(255, Math.round(Math.max(rgb.g * factor, rgb.g + minBoost))),
        b: Math.min(255, Math.round(Math.max(rgb.b * factor, rgb.b + minBoost)))
      };
    }

    function getAccentColorFromImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const width = Math.min(80, img.naturalWidth || 80);
          const height = Math.min(80, img.naturalHeight || 80);
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ r: 38, g: 85, b: 182 });
          }
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height).data;
          let total = 0;
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;

          function toHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const l = (max + min) / 2;
            const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
            return { h: 0, s, l };
          }

          for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3];
            if (alpha < 128) continue;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const { s, l } = toHsl(r, g, b);
            const isTooDark = l < 0.15;
            const isTooLight = l > 0.92;
            if (s < 0.18 || isTooDark || isTooLight) continue;
            rSum += r;
            gSum += g;
            bSum += b;
            total += 1;
          }

          if (!total) {
            for (let i = 0; i < imageData.length; i += 4) {
              const alpha = imageData[i + 3];
              if (alpha < 128) continue;
              rSum += imageData[i];
              gSum += imageData[i + 1];
              bSum += imageData[i + 2];
              total += 1;
            }
          }

          if (!total) {
            return resolve({ r: 38, g: 85, b: 182 });
          }

          resolve(brightenColor({
            r: Math.round(rSum / total),
            g: Math.round(gSum / total),
            b: Math.round(bSum / total)
          }));
        };

        img.onerror = () => resolve({ r: 38, g: 85, b: 182 });
        img.src = src;
      });
    }

    async function applyFeaturedBackground(previewSrc) {
      if (!previewSrc) return;
      const { r, g, b } = await getAccentColorFromImage(previewSrc);
      document.body.style.background = `radial-gradient(circle at top, rgba(${r}, ${g}, ${b}, 0.16), transparent 30%), var(--bg-color)`;
    }

    function createFeaturedTrailer({ id, project, trailer }) {
      const wrapper = document.createElement('div');
      wrapper.className = 'featured-trailer no-select';

      const previewContainer = document.createElement('div');
      previewContainer.className = 'featured-preview-container';

      const previewImg = document.createElement('img');
      previewImg.src = `assets/pages/games/${id}/previews/${trailer.preview}`;
      previewImg.alt = trailer.title;
      previewImg.className = 'featured-preview-img';
      previewContainer.appendChild(previewImg);

      const featuredOverlay = document.createElement('div');
      featuredOverlay.className = 'featured-preview-overlay';

      const durationLabel = document.createElement('span');
      durationLabel.className = 'featured-duration';
      durationLabel.innerHTML = '<i class="fa-solid fa-video"></i> 00:00';
      featuredOverlay.appendChild(durationLabel);

      const pauseLabel = document.createElement('span');
      pauseLabel.className = 'featured-pause-label';
      pauseLabel.innerHTML = '<i class="fas fa-play"></i>';
      featuredOverlay.appendChild(pauseLabel);

      previewContainer.appendChild(featuredOverlay);
      loadTrailerDuration(`assets/pages/games/${id}/trailers/${trailer.file}`, durationLabel);

      const previewVideo = document.createElement('video');
      previewVideo.className = 'featured-preview-video';
      previewVideo.src = `assets/pages/games/${id}/trailers/${trailer.file}`;
      previewVideo.preload = 'metadata';
      previewVideo.muted = true;
      previewVideo.loop = false;
      previewVideo.playsInline = true;
      previewVideo.setAttribute('aria-hidden', 'true');
      previewContainer.appendChild(previewVideo);

      const pauseIcon = document.createElement('i');
      // pauseIcon.className = 'fas fa-play-circle pause-icon';
      previewContainer.appendChild(pauseIcon);

      let previewTimeout = null;
      let previewStart = 0;
      let previewEnd = 0;
      let isPreviewSegmentReady = false;

      previewVideo.addEventListener('loadedmetadata', () => {
        const duration = previewVideo.duration || 0;
        const segmentDuration = 12;
        const midpoint = duration / 2;
        previewStart = Math.max(0, midpoint - segmentDuration / 2);
        previewEnd = Math.min(duration, previewStart + segmentDuration);

        if (previewEnd - previewStart < 2) {
          previewStart = 0;
          previewEnd = Math.min(duration, segmentDuration);
        }

        isPreviewSegmentReady = previewEnd > previewStart;
      }, { once: true });

      const showPreview = async () => {
        if (!isPreviewSegmentReady && previewVideo.readyState < 2) {
          await new Promise(resolve => {
            previewVideo.addEventListener('loadedmetadata', resolve, { once: true });
          });
        }

        if (!isPreviewSegmentReady) {
          return;
        }

        previewContainer.classList.add('preview-active');
        previewImg.style.opacity = '0';
        previewVideo.style.opacity = '1';
        previewVideo.currentTime = previewStart;
        try {
          await previewVideo.play();
        } catch (error) {
          // Автозапуск может быть заблокирован, но видео остаётся готовым для показа.
        }
      };

      previewVideo.addEventListener('timeupdate', () => {
        if (!isPreviewSegmentReady) {
          return;
        }

        if (previewVideo.currentTime >= previewEnd) {
          previewVideo.currentTime = previewStart;
          previewVideo.play().catch(() => {});
        }
      });

      const hidePreview = () => {
        clearTimeout(previewTimeout);
        previewContainer.classList.remove('preview-active');
        previewVideo.pause();
        previewVideo.currentTime = previewStart;
        previewVideo.style.opacity = '0';
        previewImg.style.opacity = '1';
      };

      previewContainer.addEventListener('pointerenter', () => {
        previewTimeout = setTimeout(showPreview, 590);
      });
      previewContainer.addEventListener('pointerleave', hidePreview);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'featured-content';

      const textDiv = document.createElement('div');
      textDiv.className = 'featured-text';

      const titleEl = document.createElement('h2');
      titleEl.className = 'featured-title';
      titleEl.textContent = trailer.title;

      const gameEl = document.createElement('p');
      gameEl.className = 'featured-game';
      gameEl.textContent = project.name;

      textDiv.appendChild(titleEl);

      const btn = document.createElement('a');
      btn.href = `game-single.html?id=${id}`;
      btn.className = 'btn';
      btn.textContent = 'К игре';
      const arrow = document.createElement('i');
      arrow.className = 'fas fa-arrow-right btn-icon';
      btn.appendChild(arrow);

      contentDiv.appendChild(textDiv);

      if (!isGameSingle) {
        contentDiv.appendChild(btn);
        textDiv.appendChild(gameEl);
      }

      wrapper.appendChild(previewContainer);
      wrapper.appendChild(contentDiv);

      const handleClick = () => {
        const trailerSrc = `assets/pages/games/${id}/trailers/${trailer.file}`;
        const posterSrc = trailer.preview
          ? `assets/pages/games/${id}/previews/${trailer.preview}`
          : project.poster
            ? `assets/pages/games/${id}/${project.poster}`
            : '';
        const trailerTitle = trailer.title || 'Трейлер';
        window.videoPlayer.play(trailerSrc, posterSrc, trailerTitle, id, false, project.name);
      };

      previewImg.addEventListener('click', handleClick);
      pauseIcon.addEventListener('click', handleClick);
      previewVideo.addEventListener('click', handleClick);

      return wrapper;
    }

  } catch (error) {
    console.error('Ошибка:', error);
    const container = document.getElementById('trailersContainer') ||
                      document.getElementById('featuredTrailersContainer') ||
                      document.getElementById('trailers-section');
    if (container) {
      container.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки: ${error.message}</p>`;
    }
  }
});