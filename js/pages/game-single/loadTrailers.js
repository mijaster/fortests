document.addEventListener('DOMContentLoaded', async () => {
  const gameId = getGameIdFromURL();
  if (!gameId) return;

  try {
    const response = await fetch('json/games.json');
    const games = await response.json();
    const game = games[gameId];

    if (!game || !game.trailersPage || !Array.isArray(game.trailersPage)) return;

    const trailersSection = document.getElementById('trailers-section');
    const trailersContainer = document.getElementById('trailers-container');

    const trailersToAdd = game.trailersPage.filter(trailer => trailer.addToSinglePage);

    if (trailersToAdd.length === 0) return;

    trailersSection.style.display = 'block';

    trailersToAdd.forEach(trailer => {
      const trailerCard = document.createElement('div');
      trailerCard.className = 'trailer-card';

      const previewImg = document.createElement('img');
      previewImg.src = `assets/pages/games/${gameId}/previews/${trailer.preview}`;
      previewImg.alt = 'Превью трейлера';
      previewImg.className = 'trailer-preview';
      previewImg.loading = 'lazy';

      const playButton = document.createElement('div');
      playButton.className = 'trailer-play-button';
      playButton.innerHTML = '<i class="fas fa-play"></i>';

      const trailerSrc = `assets/pages/games/${gameId}/trailers/${trailer.file}`;
      const posterSrc = `assets/pages/games/${gameId}/previews/${trailer.preview}`;
      const trailerName = trailer.name || 'Трейлер';

      const playHandler = () => {
        window.videoPlayer.play(trailerSrc, posterSrc, trailerName, gameId);
      };

      previewImg.addEventListener('click', playHandler);
      playButton.addEventListener('click', playHandler);

      trailerCard.appendChild(previewImg);
      trailerCard.appendChild(playButton);
      trailersContainer.appendChild(trailerCard);
    });
  } catch (error) {
    console.error('Ошибка загрузки трейлеров:', error);
  }
});

function getGameIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
