document.addEventListener('DOMContentLoaded', () => {
  const configSources = {
    games: { path: 'json/games.json', rootKey: 'projects', fileName: 'games.json' },
    devs: { path: 'json/devs.json', rootKey: null, fileName: 'devs.json' }
  };

  const state = {
    mode: 'games',
    data: { games: null, devs: null },
    selectedKey: null
  };

  const elements = {
    tabs: Array.from(document.querySelectorAll('.tab-button')),
    entrySelector: document.getElementById('entry-selector'),
    newEntryButton: document.getElementById('new-entry-button'),
    deleteEntryButton: document.getElementById('delete-entry-button'),
    saveItemButton: document.getElementById('save-item-button'),
    downloadConfigButton: document.getElementById('download-config-button'),
    copyConfigButton: document.getElementById('copy-config-button'),
    itemJsonEditor: document.getElementById('item-json-editor'),
    fullConfigOutput: document.getElementById('full-config-output'),
    newEntryKey: document.getElementById('new-entry-key'),
    editorStatus: document.getElementById('editor-status')
  };

  async function init() {
    try {
      const [gamesRes, devsRes] = await Promise.all([
        fetch(configSources.games.path),
        fetch(configSources.devs.path)
      ]);

      if (!gamesRes.ok || !devsRes.ok) {
        throw new Error('Не удалось загрузить один из файлов конфигурации');
      }

      state.data.games = await gamesRes.json();
      state.data.devs = await devsRes.json();
      state.mode = 'games';
      state.selectedKey = null;
      bindEvents();
      switchMode('games');
    } catch (error) {
      showEditorMessage(error.message, true);
    }
  }

  function bindEvents() {
    elements.tabs.forEach(button => {
      button.addEventListener('click', () => switchMode(button.dataset.mode));
    });

    elements.entrySelector.addEventListener('change', () => {
      state.selectedKey = elements.entrySelector.value;
      renderSelectedItem();
    });

    elements.newEntryButton.addEventListener('click', createNewEntry);
    elements.deleteEntryButton.addEventListener('click', deleteSelectedEntry);
    elements.saveItemButton.addEventListener('click', saveCurrentItem);
    elements.downloadConfigButton.addEventListener('click', downloadCurrentConfig);
    elements.copyConfigButton.addEventListener('click', copyCurrentConfig);
    elements.itemJsonEditor.addEventListener('input', () => showEditorMessage('Изменения не сохранены', false));
  }

  function switchMode(mode) {
    if (!configSources[mode]) return;
    state.mode = mode;
    elements.tabs.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    state.selectedKey = null;
    populateEntrySelector();
    renderSelectedItem();
    updateFullConfigOutput();
  }

  function getCurrentContainer() {
    const source = configSources[state.mode];
    const data = state.data[state.mode];
    return source.rootKey ? data[source.rootKey] : data;
  }

  function getCurrentConfig() {
    const source = configSources[state.mode];
    return source.rootKey ? { ...state.data[state.mode], [source.rootKey]: getCurrentContainer() } : { ...state.data[state.mode] };
  }

  function populateEntrySelector() {
    const container = getCurrentContainer();
    elements.entrySelector.innerHTML = '';
    if (!container || typeof container !== 'object') return;

    const keys = Object.keys(container);
    keys.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    keys.forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      elements.entrySelector.appendChild(option);
    });

    if (keys.length > 0) {
      state.selectedKey = keys.includes(state.selectedKey) ? state.selectedKey : keys[0];
      elements.entrySelector.value = state.selectedKey;
    } else {
      state.selectedKey = null;
    }
  }

  function renderSelectedItem() {
    if (!state.selectedKey) {
      elements.itemJsonEditor.value = '{\n  \n}';
      showEditorMessage('Выберите запись или создайте новую', false);
      return;
    }

    const container = getCurrentContainer();
    const item = container[state.selectedKey];
    if (!item) {
      elements.itemJsonEditor.value = '{\n  \n}';
      showEditorMessage('Запись не найдена', true);
      return;
    }

    elements.itemJsonEditor.value = JSON.stringify(item, null, 2);
    showEditorMessage(`Редактируется: ${state.selectedKey}`, false);
  }

  function createNewEntry() {
    const key = elements.newEntryKey.value.trim();
    if (!key) {
      showEditorMessage('Введите ключ новой записи', true);
      return;
    }

    const container = getCurrentContainer();
    if (container[key]) {
      showEditorMessage('Запись с таким ключом уже существует', true);
      return;
    }

    container[key] = getDefaultItemForMode(state.mode);
    state.selectedKey = key;
    populateEntrySelector();
    elements.entrySelector.value = key;
    renderSelectedItem();
    updateFullConfigOutput();
    elements.newEntryKey.value = '';
    showEditorMessage('Новая запись добавлена', false);
  }

  function deleteSelectedEntry() {
    if (!state.selectedKey) {
      showEditorMessage('Сначала выберите запись', true);
      return;
    }

    const container = getCurrentContainer();
    delete container[state.selectedKey];
    state.selectedKey = null;
    populateEntrySelector();
    renderSelectedItem();
    updateFullConfigOutput();
    showEditorMessage('Запись удалена', false);
  }

  function saveCurrentItem() {
    if (!state.selectedKey) {
      showEditorMessage('Сначала выберите запись', true);
      return;
    }

    try {
      const parsed = JSON.parse(elements.itemJsonEditor.value);
      const container = getCurrentContainer();
      container[state.selectedKey] = parsed;
      updateFullConfigOutput();
      showEditorMessage('Запись успешно сохранена', false);
    } catch (error) {
      showEditorMessage('Ошибка JSON: ' + error.message, true);
    }
  }

  function downloadCurrentConfig() {
    const source = configSources[state.mode];
    const content = JSON.stringify(getCurrentConfig(), null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = source.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function copyCurrentConfig() {
    try {
      await navigator.clipboard.writeText(elements.fullConfigOutput.value);
      showEditorMessage('JSON скопирован в буфер обмена', false);
    } catch (error) {
      showEditorMessage('Не удалось скопировать: ' + error.message, true);
    }
  }

  function updateFullConfigOutput() {
    const config = getCurrentConfig();
    elements.fullConfigOutput.value = JSON.stringify(config, null, 2);
  }

  function showEditorMessage(text, error) {
    elements.editorStatus.textContent = text;
    elements.editorStatus.style.color = error ? '#ff8080' : '#b9d6ff';
  }

  function getDefaultItemForMode(mode) {
    if (mode === 'games') {
      return {
        name: '',
        dev: [],
        status: null,
        players: { min: 1, max: 1 },
        version: '',
        releaseDate: '',
        revealDate: '',
        description: '',
        poster: '',
        downloadable: false,
        downloadLinks: {
          direct: '',
          'minecraft-inside': ''
        },
        visible: true,
        tags: [],
        screens: [],
        music: [],
        trailers: [],
        indexPage: {
          backgroundPath: '',
          opacity: 1
        }
      };
    }

    return {
      name: '',
      logo: '',
      banner: '',
      description: '',
      contacts: [],
      screens: [],
      members: [],
      bg: ''
    };
  }

  init();
});
