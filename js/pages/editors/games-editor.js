// games-editor.js
document.addEventListener('DOMContentLoaded', function() {
  let gamesData = {};
  let devsData = {};
  let tagsData = {};
  let currentGameId = null;

  async function initEditor() {
    try {
      const [gamesRes, devsRes, tagsRes] = await Promise.all([
        fetch('../json/games.json'),
        fetch('../json/devs.json'),
        fetch('../json/tags.json')
      ]);

      [gamesData, devsData, tagsData] = await Promise.all([
        gamesRes.json(),
        devsRes.json(),
        tagsRes.json()
      ]);

      populateGamesList();
      setupEventListeners();
      setupMultiSelect('dev', devsData);
      setupMultiSelect('tag', tagsData);
      setupScreenshotInput();
      setupTrailerInput();
      setupMusicInput();
      setupSliders();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка: ' + error.message);
    }
  }

  function populateGamesList() {
    const container = document.getElementById('games-list-container');
    container.innerHTML = '';
    for (const [id, game] of Object.entries(gamesData)) {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.dataset.id = id;
      card.innerHTML = `
        <div class="game-card-poster" style="background-image: url('../assets/pages/games/${id}/${game.poster || 'poster.png'}');"></div>
        <div class="game-card-content">
          <h4>${game.name}</h4>
          <p>ID: ${id}</p>
          <p>Статус: ${getStatusText(game.status || 'released')}</p>
        </div>
      `;
      card.addEventListener('click', () => loadGameForEditing(id));
      container.appendChild(card);
    }
  }

  function getStatusText(status) {
    return { indev: 'В разработке', rework: 'Переработка', released: 'Выпущена' }[status] || 'Неизвестно';
  }

  function loadGameForEditing(id) {
    if (!gamesData[id]) return;
    const game = gamesData[id];
    currentGameId = id;

    document.getElementById('game-id').value = id;
    document.getElementById('game-name').value = game.name || '';
    document.getElementById('game-version').value = game.version || '';
    document.getElementById('game-description').value = game.description || '';
    document.getElementById('game-poster').value = game.poster || '';
    document.getElementById('game-link').value = game.link || '#';
    document.getElementById('game-status').value = game.status || '';
    document.getElementById('game-visible').checked = game.visible !== false;
    document.getElementById('game-downloadable').checked = game.downloadable !== false;

    if (game.date) {
      document.getElementById('game-day').value = game.date.day || '';
      document.getElementById('game-month').value = game.date.month || '';
      document.getElementById('game-year').value = game.date.year || '';
      document.getElementById('game-hour').value = game.date.hour || '';
      document.getElementById('game-minute').value = game.date.minute || '';
    }

    if (game.players) {
      document.getElementById('game-min-players').value = game.players.min || '';
      document.getElementById('game-max-players').value = game.players.max || '';
    }

    if (game.indexPage) {
      document.getElementById('game-background-path').value = game.indexPage.backgroundPath || '';
      setSlider('game-background-opacity', game.indexPage.backgroundOpacity || 0.5);
      setSlider('game-background-contrast', game.indexPage.backgroundContrast || 1);
      setSlider('game-background-brightness', game.indexPage.backgroundBrightness || 1);
      setSlider('game-background-blur', game.indexPage.backgroundBlur || 0);
      document.getElementById('game-hide-description').checked = game.indexPage.hideDescription || false;
      document.getElementById('game-hide-tags').checked = game.indexPage.hideTags || false;
    }

    setSelectedItems('dev', game.dev || []);
    setSelectedItems('tag', game.tags || []);
    setSelectedScreenshots(game.screenshots || []);
    setSelectedTrailers(game.trailersPage || []);
    setSelectedMusic(game.music || []);
  }

  function setSlider(id, value) {
    const el = document.getElementById(id);
    const display = document.getElementById(id.replace('game-', '') + '-value');
    el.value = value;
    display.textContent = value;
  }

  function setSelectedItems(type, ids) {
    const container = document.getElementById(`selected-${type}s-container`);
    container.innerHTML = '';
    const data = type === 'dev' ? devsData : tagsData;
    ids.forEach(id => {
      if (!data[id]) return;
      const item = document.createElement('div');
      item.className = 'selected-item';
      item.dataset.id = id;
      item.innerHTML = `<span>${data[id].name}</span><button class="remove-btn">&times;</button>`;
      item.querySelector('.remove-btn').addEventListener('click', () => removeSelectedItem(type, id));
      container.appendChild(item);
      const opt = document.querySelector(`#${type}-options-container [data-id="${id}"]`);
      if (opt) opt.classList.add('selected');
    });
  }

  function setSelectedScreenshots(files) {
    const container = document.getElementById('selected-screenshots-container');
    container.innerHTML = '';
    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.dataset.filename = file;
      item.innerHTML = `
        <img src="../assets/pages/games/${currentGameId}/${file}" onerror="this.src='assets/images/default_screenshot.png'">
        <div class="actions">
          <button class="edit-btn" title="Переименовать">✏️</button>
          <button class="remove-btn" title="Удалить">×</button>
        </div>
      `;
      item.querySelector('.edit-btn').addEventListener('click', () => {
        const newFile = prompt('Новое имя:', file);
        if (newFile) item.dataset.filename = newFile;
      });
      item.querySelector('.remove-btn').addEventListener('click', () => item.remove());
      container.appendChild(item);
    });
  }

  function setSelectedTrailers(trailers) {
    const container = document.getElementById('selected-trailers-container');
    container.innerHTML = '';
    trailers.forEach(tr => {
      const file = typeof tr === 'string' ? tr : tr.file;
      const preview = typeof tr === 'string' ? file.replace(/\.[^/.]+$/, ".png") : tr.preview || file.replace(/\.[^/.]+$/, ".png");
      const name = typeof tr === 'string' ? `Трейлер ${file}` : tr.name || `Трейлер ${file}`;
      const addToPage = typeof tr === 'string' ? true : tr.addToSinglePage !== false;

      const item = document.createElement('div');
      item.className = 'trailer-item';
      item.dataset.file = file;
      item.dataset.preview = preview;
      item.dataset.name = name;
      item.dataset.addToSinglePage = addToPage;

      item.innerHTML = `
        <img src="../assets/pages/games/${currentGameId}/${preview}" onerror="this.src='assets/images/default_preview.png'">
        <div class="info">
          <h5>${name}</h5>
          <p>${file}</p>
        </div>
        <div class="actions">
          <button class="play-btn" title="Просмотр">▶️</button>
          <button class="edit-btn" title="Редактировать">✏️</button>
          <button class="remove-btn" title="Удалить">×</button>
        </div>
      `;

      item.querySelector('.play-btn').addEventListener('click', () => {
        previewVideo(file);
      });

      item.querySelector('.edit-btn').addEventListener('click', () => {
        const newFile = prompt('Имя файла:', file) || file;
        const newPreview = prompt('Превью:', preview) || preview;
        const newName = prompt('Название:', name) || `Трейлер ${newFile}`;
        const newAdd = confirm('Показывать на странице игры?');
        item.dataset.file = newFile;
        item.dataset.preview = newPreview;
        item.dataset.name = newName;
        item.dataset.addToSinglePage = newAdd;
        item.querySelector('h5').textContent = newName;
        item.querySelector('p').textContent = newFile;
        item.querySelector('img').src = `../assets/pages/games/${currentGameId}/${newPreview}`;
      });

      item.querySelector('.remove-btn').addEventListener('click', () => item.remove());

      container.appendChild(item);
    });
  }

  function setSelectedMusic(music) {
    const container = document.getElementById('selected-music-container');
    container.innerHTML = '';
    if (!Array.isArray(music) || music.length === 0) return;

    music.forEach(playlist => {
      const plItem = document.createElement('div');
      plItem.className = 'playlist-item';
      plItem.innerHTML = `
        <div class="playlist-header">
          <img src="../assets/pages/games/${currentGameId}/${playlist.cover || 'cover.png'}" onerror="this.src='assets/images/default_cover.png'">
          <div class="title">${playlist.name || 'Музыка'}</div>
          <div class="actions">
            <button class="edit-btn">✏️</button>
            <button class="remove-btn">×</button>
          </div>
        </div>
        <div class="tracks-list"></div>
      `;
      plItem.querySelector('.remove-btn').addEventListener('click', () => plItem.remove());
      plItem.querySelector('.edit-btn').addEventListener('click', () => {
        const newName = prompt('Название плейлиста:', playlist.name) || playlist.name;
        const newCover = prompt('Обложка:', playlist.cover) || playlist.cover;
        plItem.querySelector('.title').textContent = newName;
        plItem.querySelector('img').src = `../assets/pages/games/${currentGameId}/${newCover}`;
      });

      const tracksContainer = plItem.querySelector('.tracks-list');
      playlist.files.forEach(track => {
        const file = typeof track === 'string' ? track : track.file;
        const name = typeof track === 'string' ? `Трек ${file}` : track.name || `Трек ${file}`;
        const trackEl = document.createElement('div');
        trackEl.className = 'track-item';
        trackEl.dataset.file = file;
        trackEl.dataset.name = name;
        trackEl.innerHTML = `
          <div class="name">${name}</div>
          <div class="actions">
            <button class="play-btn">▶️</button>
            <button class="edit-btn">✏️</button>
            <button class="remove-btn">×</button>
          </div>
        `;
        trackEl.querySelector('.play-btn').addEventListener('click', () => {
          previewAudio(file, name);
        });
        trackEl.querySelector('.edit-btn').addEventListener('click', () => {
          const newFile = prompt('Файл:', file) || file;
          const newName = prompt('Название:', name) || `Трек ${newFile}`;
          trackEl.dataset.file = newFile;
          trackEl.dataset.name = newName;
          trackEl.querySelector('.name').textContent = newName;
        });
        trackEl.querySelector('.remove-btn').addEventListener('click', () => trackEl.remove());
        tracksContainer.appendChild(trackEl);
      });

      container.appendChild(plItem);
    });
  }

  function removeSelectedItem(type, id) {
    const container = document.getElementById(`selected-${type}s-container`);
    const item = container.querySelector(`[data-id="${id}"]`);
    if (item) item.remove();
  }

  function setupMultiSelect(type, data) {
    const control = document.getElementById(`${type}-select-control`);
    const dropdown = document.getElementById(`${type}-select-dropdown`);
    const optionsContainer = document.getElementById(`${type}-options-container`);
    for (const [id, item] of Object.entries(data)) {
      const opt = document.createElement('div');
      opt.className = 'option-item';
      opt.dataset.id = id;
      opt.textContent = item.name;
      opt.addEventListener('click', () => {
        opt.classList.toggle('selected');
        const sel = document.getElementById(`selected-${type}s-container`);
        const existing = sel.querySelector(`[data-id="${id}"]`);
        if (opt.classList.contains('selected') && !existing) {
          const newItem = document.createElement('div');
          newItem.className = 'selected-item';
          newItem.dataset.id = id;
          newItem.innerHTML = `<span>${item.name}</span><button class="remove-btn">&times;</button>`;
          newItem.querySelector('.remove-btn').addEventListener('click', () => {
            removeSelectedItem(type, id);
            opt.classList.remove('selected');
          });
          sel.appendChild(newItem);
        } else if (!opt.classList.contains('selected') && existing) {
          existing.remove();
        }
      });
      optionsContainer.appendChild(opt);
    }
    control.addEventListener('click', () => {
      control.classList.toggle('active');
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!control.contains(e.target) && !dropdown.contains(e.target)) {
        control.classList.remove('active');
        dropdown.classList.remove('open');
      }
    });
  }

  function setupScreenshotInput() {
    const input = document.getElementById('screenshot-input');
    const btn = document.getElementById('add-screenshot-btn');
    const container = document.getElementById('selected-screenshots-container');
    btn.addEventListener('click', () => {
      const file = input.value.trim();
      if (!file) return;
      if (container.querySelector(`[data-filename="${file}"]`)) {
        alert('Уже есть');
        return;
      }
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.dataset.filename = file;
      item.innerHTML = `<img src="../assets/pages/games/${currentGameId || 'default'}/${file}" onerror="this.src='assets/images/default_screenshot.png'"><div class="actions"><button class="edit-btn">✏️</button><button class="remove-btn">×</button></div>`;
      item.querySelector('.edit-btn').addEventListener('click', () => {
        const newFile = prompt('Переименовать:', file);
        if (newFile) item.dataset.filename = newFile;
      });
      item.querySelector('.remove-btn').addEventListener('click', () => item.remove());
      container.appendChild(item);
      input.value = '';
    });
  }

  function setupTrailerInput() {
    const fileIn = document.getElementById('trailer-file-input');
    const previewIn = document.getElementById('trailer-preview-input');
    const nameIn = document.getElementById('trailer-name-input');
    const addToPage = document.getElementById('trailer-add-to-single-page');
    const btn = document.getElementById('add-trailer-btn');
    const container = document.getElementById('selected-trailers-container');

    btn.addEventListener('click', () => {
      const file = fileIn.value.trim();
      if (!file) {
        alert('Укажите файл');
        return;
      }
      if (container.querySelector(`[data-file="${file}"]`)) {
        alert('Уже есть');
        return;
      }
      const item = document.createElement('div');
      item.className = 'trailer-item';
      item.dataset.file = file;
      item.dataset.preview = (previewIn.value || file.replace(/\.[^/.]+$/, ".png")).trim();
      item.dataset.name = (nameIn.value || `Трейлер ${file}`).trim();
      item.dataset.addToSinglePage = addToPage.checked;

      item.innerHTML = `<img src="../assets/pages/games/${currentGameId || 'default'}/${item.dataset.preview}" onerror="this.src='assets/images/default_preview.png'"><div class="info"><h5>${item.dataset.name}</h5><p>${file}</p></div><div class="actions"><button class="play-btn">▶️</button><button class="edit-btn">✏️</button><button class="remove-btn">×</button></div>`;

      item.querySelector('.play-btn').addEventListener('click', () => previewVideo(file));
      item.querySelector('.edit-btn').addEventListener('click', editTrailer);
      item.querySelector('.remove-btn').addEventListener('click', () => item.remove());

      container.appendChild(item);
      fileIn.value = '';
      previewIn.value = '';
      nameIn.value = '';
      addToPage.checked = true;
    });
  }

  function setupMusicInput() {
    const nameIn = document.getElementById('music-name-input');
    const coverIn = document.getElementById('music-cover-input');
    const fileIn = document.getElementById('music-file-input');
    const trackNameIn = document.getElementById('music-track-name-input');
    const btn = document.getElementById('add-music-btn');
    const container = document.getElementById('selected-music-container');

    btn.addEventListener('click', () => {
      const file = fileIn.value.trim();
      if (!file) {
        alert('Файл обязателен');
        return;
      }
      let playlist = container.querySelector('.playlist-item');
      if (!playlist) {
        playlist = document.createElement('div');
        playlist.className = 'playlist-item';
        playlist.innerHTML = `<div class="playlist-header"><img src="../assets/pages/games/${currentGameId || 'default'}/${coverIn.value || 'cover.png'}"><div class="title">${nameIn.value || 'Новый плейлист'}</div><div class="actions"><button class="edit-btn">✏️</button><button class="remove-btn">×</button></div></div><div class="tracks-list"></div>`;
        playlist.querySelector('.remove-btn').addEventListener('click', () => playlist.remove());
        playlist.querySelector('.edit-btn').addEventListener('click', () => {
          const newName = prompt('Название:', playlist.querySelector('.title').textContent) || 'Музыка';
          playlist.querySelector('.title').textContent = newName;
        });
        container.appendChild(playlist);
      }
      const trackList = playlist.querySelector('.tracks-list');
      if (trackList.querySelector(`[data-file="${file}"]`)) {
        alert('Трек уже есть');
        return;
      }
      const track = document.createElement('div');
      track.className = 'track-item';
      track.dataset.file = file;
      track.dataset.name = trackNameIn.value || `Трек ${file}`;
      track.innerHTML = `<div class="name">${track.dataset.name}</div><div class="actions"><button class="play-btn">▶️</button><button class="edit-btn">✏️</button><button class="remove-btn">×</button></div>`;
      track.querySelector('.play-btn').addEventListener('click', () => previewAudio(file, track.dataset.name));
      track.querySelector('.edit-btn').addEventListener('click', () => {
        const newName = prompt('Название:', track.dataset.name) || `Трек ${file}`;
        track.dataset.name = newName;
        track.querySelector('.name').textContent = newName;
      });
      track.querySelector('.remove-btn').addEventListener('click', () => track.remove());
      trackList.appendChild(track);
      fileIn.value = '';
      trackNameIn.value = '';
    });
  }

  function setupSliders() {
    ['opacity', 'contrast', 'brightness', 'blur'].forEach(key => {
      const slider = document.getElementById(`game-background-${key}`);
      const value = document.getElementById(`${key}-value`);
      slider.addEventListener('input', () => value.textContent = slider.value);
    });
  }

  function previewVideo(file) {
    document.getElementById('preview-video').src = `../assets/pages/games/${currentGameId}/${file}`;
    document.getElementById('video-preview').style.display = 'block';
  }

  function previewAudio(src, name) {
    document.getElementById('preview-audio').src = `../assets/pages/games/${currentGameId}/${src}`;
    document.getElementById('audio-info').textContent = `Трек: ${name}`;
    document.getElementById('audio-preview').style.display = 'block';
    document.getElementById('preview-audio').play();
  }

  document.getElementById('close-video-preview').addEventListener('click', () => {
    document.getElementById('video-preview').style.display = 'none';
    document.getElementById('preview-video').pause();
  });

  document.getElementById('close-audio-preview').addEventListener('click', () => {
    document.getElementById('audio-preview').style.display = 'none';
    document.getElementById('preview-audio').pause();
  });

  function updateCurrentGame() {
    const id = document.getElementById('game-id').value.trim();
    const name = document.getElementById('game-name').value.trim();
    if (!id || !name) {
      alert('ID и имя обязательны');
      return;
    }

    const game = {
      name,
      dev: Array.from(document.querySelectorAll('#selected-devs-container .selected-item')).map(el => el.dataset.id),
      version: document.getElementById('game-version').value,
      status: document.getElementById('game-status').value,
      description: document.getElementById('game-description').value,
      poster: document.getElementById('game-poster').value || undefined,
      link: document.getElementById('game-link').value,
      downloadable: document.getElementById('game-downloadable').checked,
      visible: document.getElementById('game-visible').checked,
      tags: Array.from(document.querySelectorAll('#selected-tags-container .selected-item')).map(el => el.dataset.id),
      date: {
        day: parseInt(document.getElementById('game-day').value) || null,
        month: parseInt(document.getElementById('game-month').value) || null,
        year: parseInt(document.getElementById('game-year').value) || null,
        hour: parseInt(document.getElementById('game-hour').value) || null,
        minute: parseInt(document.getElementById('game-minute').value) || null
      },
      players: (() => {
        const min = parseInt(document.getElementById('game-min-players').value);
        const max = parseInt(document.getElementById('game-max-players').value);
        if (!isNaN(min) || !isNaN(max)) {
          const players = {};
          if (!isNaN(min)) players.min = min;
          if (!isNaN(max)) players.max = max;
          return players;
        }
        return undefined;
      })(),
      screenshots: Array.from(document.querySelectorAll('#selected-screenshots-container .screenshot-item')).map(el => el.dataset.filename),
      trailersPage: Array.from(document.querySelectorAll('#selected-trailers-container .trailer-item')).map(el => ({
        file: el.dataset.file,
        preview: el.dataset.preview,
        name: el.dataset.name,
        addToSinglePage: el.dataset.addToSinglePage === 'true'
      })),
      music: Array.from(document.querySelectorAll('.playlist-item')).map(playlistEl => {
        const tracks = Array.from(playlistEl.querySelectorAll('.track-item')).map(trackEl => ({
          file: trackEl.dataset.file,
          name: trackEl.dataset.name
        }));
        if (tracks.length === 0) return null;
        return {
          name: playlistEl.querySelector('.title').textContent,
          cover: playlistEl.querySelector('img').src.split('/').pop(),
          files: tracks
        };
      }).filter(Boolean),
      indexPage: (() => {
        const bgPath = document.getElementById('game-background-path').value;
        if (!bgPath) return undefined;
        return {
          backgroundPath: bgPath,
          backgroundOpacity: parseFloat(document.getElementById('game-background-opacity').value),
          backgroundContrast: parseFloat(document.getElementById('game-background-contrast').value),
          backgroundBrightness: parseFloat(document.getElementById('game-background-brightness').value),
          backgroundBlur: parseFloat(document.getElementById('game-background-blur').value),
          hideDescription: document.getElementById('game-hide-description').checked,
          hideTags: document.getElementById('game-hide-tags').checked
        };
      })()
    };

    // Очистка null/undefined
    Object.keys(game).forEach(key => {
      if (game[key] === null || game[key] === undefined || (Array.isArray(game[key]) && game[key].length === 0)) {
        delete game[key];
      }
    });

    gamesData[id] = game;
    currentGameId = id;
    populateGamesList();
    alert('✅ Игра сохранена');
  }

  function deleteCurrentGame() {
    if (!currentGameId) {
      alert('Выберите игру');
      return;
    }
    if (confirm(`Удалить игру "${gamesData[currentGameId].name}"?`)) {
      delete gamesData[currentGameId];
      currentGameId = null;
      document.getElementById('game-id').value = '';
      document.getElementById('game-name').value = '';
      document.getElementById('selected-devs-container').innerHTML = '';
      document.getElementById('selected-tags-container').innerHTML = '';
      document.getElementById('selected-screenshots-container').innerHTML = '';
      document.getElementById('selected-trailers-container').innerHTML = '';
      document.getElementById('selected-music-container').innerHTML = '';
      populateGamesList();
      alert('🗑 Игра удалена');
    }
  }

  async function saveChangesToFile() {
    if (!confirm('Скопировать JSON в буфер?')) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(gamesData, null, 2));
      alert('📋 JSON скопирован в буфер обмена!');
    } catch (e) {
      alert('Ошибка копирования: ' + e.message);
      console.error(e);
    }
  }

  function setupEventListeners() {
    document.getElementById('add-game-btn').addEventListener('click', () => {
      document.getElementById('game-id').value = '';
      document.getElementById('game-name').value = '';
      document.getElementById('game-version').value = '';
      document.getElementById('game-description').value = '';
      document.getElementById('game-poster').value = '';
      document.getElementById('game-link').value = '#';
      document.getElementById('game-status').value = '';
      document.getElementById('game-visible').checked = true;
      document.getElementById('game-downloadable').checked = true;
      document.getElementById('game-day').value = '';
      document.getElementById('game-month').value = '';
      document.getElementById('game-year').value = '';
      document.getElementById('game-hour').value = '';
      document.getElementById('game-minute').value = '';
      document.getElementById('game-min-players').value = '';
      document.getElementById('game-max-players').value = '';
      document.getElementById('game-background-path').value = '';
      setSlider('game-background-opacity', 0.5);
      setSlider('game-background-contrast', 1);
      setSlider('game-background-brightness', 1);
      setSlider('game-background-blur', 0);
      document.getElementById('game-hide-description').checked = false;
      document.getElementById('game-hide-tags').checked = false;
      document.getElementById('selected-devs-container').innerHTML = '';
      document.getElementById('selected-tags-container').innerHTML = '';
      document.getElementById('selected-screenshots-container').innerHTML = '';
      document.getElementById('selected-trailers-container').innerHTML = '';
      document.getElementById('selected-music-container').innerHTML = '';
      currentGameId = null;
    });

    document.getElementById('update-game-btn').addEventListener('click', updateCurrentGame);
    document.getElementById('delete-game-btn').addEventListener('click', deleteCurrentGame);
    document.getElementById('save-changes-btn').addEventListener('click', saveChangesToFile);
  }

  initEditor();
});
