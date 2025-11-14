document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (!gameId) {
    document.getElementById('game-title').textContent = 'Игра не найдена';
    throw new Error('No game ID provided');
  }

  const gameInfoContainer = document.querySelector('.game-info');
  const rightPart = document.querySelector('.right-part');

  function addAdditionalInfo(game, devsData) {

    if (!game.description || game.description == "") {
        const descriptionEl = document.getElementById('game-description');
        descriptionEl.style.display = "none";
    }
    if (game.version) {
      const versionEl = document.createElement('p');
      versionEl.innerHTML = `<p>Версия: ${game.version}</p>`;
      versionEl.classList.add('game-info-item');
      gameInfoContainer.insertBefore(versionEl, rightPart);
    }

    if (game.dev && Array.isArray(game.dev) && game.dev.length > 0) {
      const devContainer = document.createElement('p');
      devContainer.innerHTML = `<p class="dev-title">Разработчик:</p>`;
      devContainer.classList.add('game-info-item', 'devs-container');
      gameInfoContainer.insertBefore(devContainer, rightPart);

      game.dev.forEach(devId => {
        const dev = devsData[devId];
        if (!dev) return;

        const devLink = document.createElement('a');
        devLink.href = 'dev-single.html?id=' + devId;
        // devLink.target = '_blank';
        devLink.rel = 'noopener noreferrer';
        devLink.classList.add('dev-link');

        const logo = document.createElement('img');
        logo.src = `assets/pages/devs/${devId}/${dev.logo}`;
        logo.alt = dev.name;
        logo.classList.add('dev-logo');

        logo.onerror = () => {
          console.error(`Не удалось загрузить логотип: ${logo.src}`);
          logo.style.display = 'none';
        };

        const name = document.createElement('span');
        name.textContent = dev.name;

        devLink.appendChild(logo);
        devLink.appendChild(name);
        devContainer.appendChild(devLink);
      });
    }

    if (game.realiseDate) {
      const releaseEl = document.createElement('p');
      releaseEl.innerHTML = `<p>Дата выхода: ${game.realiseDate}</p>`;
      releaseEl.classList.add('game-info-item');
      gameInfoContainer.insertBefore(releaseEl, rightPart);
    }
  }

  fetch('json/games.json')
    .then(res => {
      if (!res.ok) throw new Error('Не удалось загрузить games.json');
      return res.json();
    })
    .then(data => {
      const game = data[gameId];

      if (!game || !game.visible) {
        document.getElementById('game-title').textContent = 'Игра не найдена или скрыта';
        return;
      }

      return fetch('json/devs.json')
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить devs.json');
          return res.json();
        })
        .then(devsData => {
          document.getElementById('game-title').textContent = game.name;
          document.getElementById('game-status').textContent = game.status;

          const background = document.getElementById('game-background');
          const bgPath = game.indexPage?.backgroundPath;

          if (bgPath) {
            if (bgPath.endsWith('.mp4')) {
              background.innerHTML = `
                <video autoplay muted loop playsinline>
                  <source src="assets/pages/games/${gameId}/${bgPath}" type="video/mp4">
                </video>
              `;
            } else {
              background.style.backgroundImage = `url(assets/pages/games/${gameId}/${bgPath})`;
              background.style.opacity = game.indexPage.backgroundOpacity || 1;
              background.style.filter = `
                contrast(${game.indexPage.backgroundContrast || 1})
                brightness(${game.indexPage.backgroundBrightness || 1})
                blur(${game.indexPage.backgroundBlur || 0}px)
              `;
            }
          }

          const poster = document.getElementById('game-poster');
          const posterPath = game.poster;
          if (posterPath.endsWith('.mp4')) {
            poster.innerHTML = `
              <video autoplay muted loop playsinline>
                <source src="assets/pages/games/${gameId}/${posterPath}" type="video/mp4">
              </video>
            `;
          } else {
            poster.style.backgroundImage = `url(assets/pages/games/${gameId}/${posterPath})`;
          }

          const tagsContainer = document.getElementById('game-tags');
          tagsContainer.innerHTML = game.tags.map(tag => `<li>${tag}</li>`).join('');

          document.getElementById('game-description').innerHTML = game.description.replace("<br>", '<br style="text-indent: 20px;">');

          const link = document.getElementById('game-link');
          link.href = game.link;
          if (!game.downloadable) {
            link.textContent = 'В разработке';
            link.removeAttribute('target');
            link.classList.add('disabled-link');
            link.disabled = true;
          }

          addAdditionalInfo(game, devsData);
        });
    })
    .catch(err => {
      console.error('Ошибка:', err);
      document.getElementById('game-title').textContent = 'Ошибка загрузки данных';
    });
});
