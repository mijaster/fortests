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
        allTrailers.push({ id, project, trailer });
      }
    }

    if (allTrailers.length === 0) {
      const container = document.getElementById('trailersContainer');
      if (container) {
        container.innerHTML = '<p class="no-trailers">Нет доступных трейлеров.</p>';
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
        const posterSrc = `assets/pages/games/${id}/previews/${trailer.preview}`;
        const trailerTitle = trailer.title || 'Трейлер';
        window.videoPlayer.play(trailerSrc, posterSrc, trailerTitle, id);
      };

      previewImg.addEventListener('click', handleClick);
      playButton.addEventListener('click', handleClick);

      return card;
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

      const pauseIcon = document.createElement('i');
      pauseIcon.className = 'fas fa-play-circle pause-icon';
      previewContainer.appendChild(pauseIcon);

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
        const posterSrc = `assets/pages/games/${id}/previews/${trailer.preview}`;
        const trailerTitle = trailer.title || 'Трейлер';
        window.videoPlayer.play(trailerSrc, posterSrc, trailerTitle, id);
      };

      previewImg.addEventListener('click', handleClick);
      pauseIcon.addEventListener('click', handleClick);

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