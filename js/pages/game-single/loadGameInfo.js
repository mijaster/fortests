document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (!gameId) {
    document.getElementById('game-title').textContent = 'Игра не найдена';
    throw new Error('No game ID provided');
  }

  const gameInfoContainer = document.querySelector('.game-info');
  const rightPart = document.querySelector('.right-part');

  const downloadModal = document.getElementById('download-modal');
  const downloadModalClose = document.getElementById('download-modal-close');
  const directOption = document.getElementById('direct-option');
  const minecraftInsideOption = document.getElementById('minecraft-inside-option');
  const gameLink = document.getElementById('game-link');

  downloadModalClose.addEventListener('click', () => {
    downloadModal.classList.remove('open');
    setTimeout(() => {
      downloadModal.style.display = 'none';
    }, 300);
  });

  downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) {
      downloadModal.classList.remove('open');
      setTimeout(() => {
        downloadModal.style.display = 'none';
      }, 300);
    }
  });

  function getDirectDownloadLink(url) {
    if (url.includes('drive.google.com/file/d/')) {
      const idMatch = url.match(/file\/d\/([^\/]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    }
    return url;
  }

  async function getFileSize(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      if (size) {
        const num = parseInt(size, 10);
        if (num < 1024) return `${num} Б`;
        else if (num < 1048576) return `${(num / 1024).toFixed(1)} КБ`;
        else if (num < 1073741824) return `${(num / 1048576).toFixed(1)} МБ`;
        else return `${(num / 1073741824).toFixed(1)} ГБ`;
      }
    } catch (e) {
      console.warn('Не удалось получить размер файла:', e);
    }
    return '';
  }

  gameLink.addEventListener('click', async function (e) {
    e.preventDefault();

    const game = window.currentGameData;

    if (!game || !game.downloadable) return;

    const direct = game.downloadLinks?.direct;
    const minecraftInside = game.downloadLinks?.["minecraft-inside"];

    if (direct && !minecraftInside) {
      let finalUrl = direct;
      if (!direct.startsWith('http')) {
        finalUrl = `assets/pages/games/${gameId}/versions/${direct}`;
      } else {
        finalUrl = getDirectDownloadLink(direct);
      }
      window.open(finalUrl, '_blank');
    } else if (!direct && minecraftInside) {
      window.open(minecraftInside, '_blank');
    } else if (direct && minecraftInside) {
      let directUrl = direct;
      if (!direct.startsWith('http')) {
        directUrl = `assets/pages/games/${gameId}/versions/${direct}`;
      } else {
        directUrl = getDirectDownloadLink(direct);
      }

      directOption.href = directUrl;
      minecraftInsideOption.href = minecraftInside;
      directOption.target = minecraftInsideOption.target = '_blank';

      const directSize = await getFileSize(directUrl);
      const directBtn = directOption.querySelector('.download-btn');
      if (directSize) {
        directBtn.textContent = `прямое [${directSize}]`;
      } else {
        directBtn.textContent = 'прямое';
      }

      downloadModal.style.display = 'flex';
      requestAnimationFrame(() => {
        downloadModal.classList.add('open');
      });
    }
  });

  function addAdditionalInfo(game, devsData) {
    if (!game.description || game.description === "") {
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
        devLink.rel = 'noopener noreferrer';
        devLink.classList.add('dev-link');

        const logo = document.createElement('img');
        logo.src = `assets/pages/devs/${devId}/${dev.logo}`;
        logo.alt = dev.name;
        logo.classList.add('dev-logo');
        logo.onerror = () => (logo.style.display = 'none');

        const name = document.createElement('span');
        name.textContent = dev.name;

        devLink.appendChild(logo);
        devLink.appendChild(name);
        devContainer.appendChild(devLink);
      });
    }

    if (game.players) {
      const { min, max } = game.players;
      let playersText = '';
      if (min === 1 && max === 1) playersText = '1 игрок';
      else if (min === 1) playersText = `до ${max}`;
      else if (min && max) playersText = `от ${min} до ${max}`;
      else if (min) playersText = `от ${min}`;
      else if (max) playersText = `до ${max}`;

      if (playersText) {
        const playersEl = document.createElement('p');
        playersEl.innerHTML = `<p>Кол-во игроков: ${playersText}</p>`;
        playersEl.classList.add('game-info-item');
        gameInfoContainer.insertBefore(playersEl, rightPart);
      }
    }

    if (game.releaseDate) {
      const releaseEl = document.createElement('p');
      releaseEl.innerHTML = `<p>Дата выхода: ${game.releaseDate}</p>`;
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
      const game = data.projects[gameId];

      if (!game || !game.visible) {
        document.getElementById('game-title').textContent = 'Игра не найдена или скрыта';
        return;
      }
      document.title = data.projects[gameId].name + " " + (data.projects[gameId].status ? data.projects[gameId].status : "");
      
      return fetch('json/devs.json')
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить devs.json');
          return res.json();
        })
        .then(async devsData => {
          document.getElementById('game-title').textContent = game.name;
          
          if (game.status) {
            document.getElementById('game-status').textContent = game.status;
          } else {
            document.getElementById('game-status').style.display = "none";
          }

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
              background.style.opacity = game.indexPage.opacity || 1;
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

          document.getElementById('game-description').innerHTML = game.description.replace(/<br>/g, '<br style="text-indent: 20px;">');

          const downloadLinks = game.downloadLinks || {};

          if (!game.downloadable || (!downloadLinks.direct && !downloadLinks["minecraft-inside"])) {
            gameLink.textContent = 'недоступно';
            gameLink.removeAttribute('href');
            gameLink.removeAttribute('target');
            gameLink.classList.add('disabled-link');
            gameLink.onclick = e => e.preventDefault();
          } else {
            gameLink.href = '#';
            gameLink.setAttribute('target', '_self');

            if (downloadLinks.direct && !downloadLinks["minecraft-inside"]) {
              let directUrl = downloadLinks.direct;
              if (!directUrl.startsWith('http')) {
                directUrl = `assets/pages/games/${gameId}/versions/${downloadLinks.direct}`;
              } else {
                directUrl = getDirectDownloadLink(downloadLinks.direct);
              }
              const size = await getFileSize(directUrl);
              if (size) {
                gameLink.textContent = `скачать [${size}]`;
              }
            }
          }

          addAdditionalInfo(game, devsData);
          window.currentGameData = game;
        });
    })
    .catch(err => {
      console.error('Ошибка:', err);
      document.getElementById('game-title').textContent = 'Ошибка загрузки данных';
    });
});