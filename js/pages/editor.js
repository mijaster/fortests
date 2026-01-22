let gamesData = {};
let currentEditId = null;
let tagsConfig = {};
let devsConfig = {};
let newsData = { news: [] };
let currentEditNewsIndex = null;
let currentEditDevId = null;

// Функция для получения текущей даты в формате ДД-ММ-ГГГГ
function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
}

// Общая функция для форматирования текста
function formatText(command, editorId) {
    document.getElementById(editorId).focus();
    document.execCommand(command, false, null);
    updateEditorInput(editorId);
}

// Общая функция для вставки абзаца
function insertParagraph(editorId) {
    const editor = document.getElementById(editorId);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const newParagraph = document.createElement('p');
    newParagraph.innerHTML = '<br>';
    
    if (range.startContainer.nodeName === 'P') {
        range.startContainer.parentNode.insertBefore(newParagraph, range.startContainer.nextSibling);
    } else {
        const currentParagraph = range.startContainer.parentElement.closest('p');
        if (currentParagraph) {
            currentParagraph.parentNode.insertBefore(newParagraph, currentParagraph.nextSibling);
        } else {
            editor.appendChild(newParagraph);
        }
    }
    
    const newRange = document.createRange();
    newRange.setStart(newParagraph, 0);
    newRange.setEnd(newParagraph, 0);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    updateEditorInput(editorId);
}

// Общая функция для обновления скрытого поля редактора
function updateEditorInput(editorId) {
    const editor = document.getElementById(editorId);
    document.getElementById(`${editorId}Raw`).value = editor.innerHTML;
}

// Функция для переключения между вкладками
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    document.getElementById('gamesEditor').style.display = tabName === 'games' ? 'flex' : 'none';
    document.getElementById('newsEditor').style.display = tabName === 'news' ? 'block' : 'none';
    document.getElementById('devsEditor').style.display = tabName === 'devs' ? 'block' : 'none';
}

window.onload = async function () {
    try {
        const tagsResponse = await fetch('json/tags_config.json');
        if (!tagsResponse.ok) throw new Error('Ошибка загрузки тегов');
        tagsConfig = await tagsResponse.json();
        renderTags();

        const devsResponse = await fetch('json/devs_config.json');
        if (!devsResponse.ok) throw new Error('Ошибка загрузки разработчиков');
        devsConfig = await devsResponse.json();
        renderDevs();
        updateDevsList();
        updateDevsJson();

        const gamesResponse = await fetch('json/games_config.json');
        if (!gamesResponse.ok) throw new Error('Файл не найден или ошибка сервера');
        gamesData = await gamesResponse.json();
        updateFinalJson();
        updateGamesList();
        showMessage('Конфиг игр успешно загружен!', 'success');

        // Инициализация редакторов
        document.getElementById('gameDescription').addEventListener('input', () => updateEditorInput('gameDescription'));
        document.getElementById('gameDescription').addEventListener('blur', () => updateEditorInput('gameDescription'));
        document.getElementById('newsText').addEventListener('input', () => updateEditorInput('newsText'));
        document.getElementById('newsText').addEventListener('blur', () => updateEditorInput('newsText'));
        document.getElementById('devDescription').addEventListener('input', () => updateEditorInput('devDescription'));
        document.getElementById('devDescription').addEventListener('blur', () => updateEditorInput('devDescription'));

        // Загружаем новости
        await loadNewsData();

        // Добавляем поле для обложки по умолчанию
        addCover('imgs/default_cover.png');

        // Инициализация редактора разработчиков
        addContact();
        addScreen();
        setBgValue('#000000');

    } catch (error) {
        showMessage('Ошибка загрузки конфига: ' + error.message, 'error');
        gamesData = {};
        newsData = { news: [] };
        devsConfig = {};
        updateFinalJson();
        updateGamesList();
        updateNewsJson();
        updateNewsList();
        updateDevsJson();
        updateDevsList();
    }
    
    // Закрытие меню при клике вне его области
    document.addEventListener('click', function(e) {
        const tagsMenu = document.getElementById('tagsDropdownMenu');
        const tagsButton = document.getElementById('tagsDropdownButton');
        const devsMenu = document.getElementById('devsDropdownMenu');
        const devsButton = document.getElementById('devsDropdownButton');
        
        if (tagsButton && !tagsButton.contains(e.target) && tagsMenu && !tagsMenu.contains(e.target)) {
            tagsMenu.classList.remove('active');
        }
        
        if (devsButton && !devsButton.contains(e.target) && devsMenu && !devsMenu.contains(e.target)) {
            devsMenu.classList.remove('active');
        }
    });
};

/* ================ Функции для работы с играми ================ */

function addTrailer(trailerData = {}, isMain = false) {
    const container = document.getElementById('trailersContainer');
    const trailerId = Date.now();
    const trailerName = trailerData.name || '';
    
    const trailerHtml = `
        <div class="trailer-item" data-id="${trailerId}">
            <div class="trailer-header" onclick="toggleTrailer(${trailerId})">
                <div class="main-trailer-toggle" onclick="event.stopPropagation(); toggleMainTrailer('${trailerId}')">
                    <div class="main-trailer-checkbox ${isMain ? 'checked' : ''}">
                        <div class="main-trailer-checkmark"></div>
                    </div>
                    <span class="main-trailer-label">Основной</span>
                </div>
                <span class="trailer-title">${trailerName || 'Новый трейлер'}</span>
                <div class="trailer-actions">
                    <button class="toggle-trailer" title="Свернуть/развернуть">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="remove-trailer" onclick="event.stopPropagation(); removeTrailer(${trailerId})" title="Удалить">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="trailer-content">
                <label>Название трейлера:</label>
                <input type="text" class="trailer-name" value="${trailerName}" 
                       placeholder="Например, Главный трейлер" oninput="updateTrailerTitle(${trailerId})">
                <label>Превью (имя файла):</label>
                <input type="text" class="trailer-preview" value="${trailerData.preview || ''}" 
                       placeholder="Например, trailer-preview.png">
                <label>Видео (имя файла):</label>
                <input type="text" class="trailer-video" value="${trailerData.video || ''}" 
                       placeholder="Например, trailer.mp4">
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', trailerHtml);
    toggleTrailer(trailerId);
}

function toggleTrailer(trailerId) {
    const trailerElement = document.querySelector(`.trailer-item[data-id="${trailerId}"]`);
    if (trailerElement) {
        trailerElement.classList.toggle('expanded');
    }
}

function toggleMainTrailer(trailerId) {
    const trailerElement = document.querySelector(`.trailer-item[data-id="${trailerId}"]`);
    if (!trailerElement) return;

    const checkbox = trailerElement.querySelector('.main-trailer-checkbox');
    const isCurrentlyMain = checkbox.classList.contains('checked');

    if (isCurrentlyMain) {
        checkbox.classList.remove('checked');
    } else {
        document.querySelectorAll('.main-trailer-checkbox').forEach(cb => {
            cb.classList.remove('checked');
        });
        checkbox.classList.add('checked');
    }
}

function removeTrailer(trailerId) {
    const trailerElement = document.querySelector(`.trailer-item[data-id="${trailerId}"]`);
    if (!trailerElement) return;
    
    const isMain = trailerElement.querySelector('.main-trailer-checkbox').classList.contains('checked');
    
    if (confirm('Удалить этот трейлер?')) {
        trailerElement.remove();
        
        if (isMain) {
            const firstTrailer = document.querySelector('.trailer-item');
            if (firstTrailer) {
                firstTrailer.querySelector('.main-trailer-checkbox').classList.add('checked');
            }
        }
    }
}

function updateTrailerTitle(trailerId) {
    const trailerElement = document.querySelector(`.trailer-item[data-id="${trailerId}"]`);
    if (trailerElement) {
        const nameInput = trailerElement.querySelector('.trailer-name');
        const titleElement = trailerElement.querySelector('.trailer-title');
        titleElement.textContent = nameInput.value || 'Новый трейлер';
    }
}

function getTrailersData() {
    const trailers = {};
    let counter = 1;
    let mainTrailerId = null;
    
    document.querySelectorAll('.trailer-item').forEach(item => {
        const trailerId = item.getAttribute('data-id');
        const name = item.querySelector('.trailer-name').value.trim();
        const preview = item.querySelector('.trailer-preview').value.trim();
        const video = item.querySelector('.trailer-video').value.trim();
        const isMain = item.querySelector('.main-trailer-checkbox').classList.contains('checked');
        
        if (name && preview && video) {
            const trailerKey = `trailer${counter}`;
            trailers[trailerKey] = {
                name: name,
                preview: preview,
                video: video
            };
            
            if (isMain) {
                mainTrailerId = trailerKey;
            }
            counter++;
        }
    });
    
    return {
        trailers: Object.keys(trailers).length > 0 ? trailers : null,
        mainTrailer: mainTrailerId
    };
}

function renderTags() {
    const menu = document.getElementById('tagsDropdownMenu');
    menu.innerHTML = '';

    for (const [tagKey, tagData] of Object.entries(tagsConfig)) {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.setAttribute('data-tag', tagKey);
        tagItem.innerHTML = `
            <div class="tag-checkbox">
                <i class="fa-solid fa-check" style="display: none;"></i>
            </div>
            <span class="tag-name">${tagData.name}</span>
        `;
        menu.appendChild(tagItem);
        tagItem.addEventListener('click', () => toggleTagSelection(tagItem));
    }

    const dropdownButton = document.getElementById('tagsDropdownButton');
    const dropdownMenu = document.getElementById('tagsDropdownMenu');
    dropdownButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
}

function renderDevs() {
    const menu = document.getElementById('devsDropdownMenu');
    menu.innerHTML = '';

    for (const [devKey, devData] of Object.entries(devsConfig)) {
        const devItem = document.createElement('div');
        devItem.className = 'dev-item';
        devItem.setAttribute('data-dev', devKey);
        devItem.innerHTML = `
            <div class="tag-checkbox">
                <i class="fa-solid fa-check" style="display: none;"></i>
            </div>
            <img src="${devData.logo}" alt="" class="dev-logo">
            <span class="dev-name">${devData.name}</span>
        `;
        menu.appendChild(devItem);
        devItem.addEventListener('click', () => toggleDevSelection(devItem));
    }

    const dropdownButton = document.getElementById('devsDropdownButton');
    const dropdownMenu = document.getElementById('devsDropdownMenu');
    dropdownButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
}

function toggleTagSelection(tagItem) {
    const checkbox = tagItem.querySelector('.tag-checkbox');
    const isChecked = checkbox.classList.contains('checked');

    if (isChecked) {
        checkbox.classList.remove('checked');
        checkbox.querySelector('i').style.display = 'none';
    } else {
        checkbox.classList.add('checked');
        checkbox.querySelector('i').style.display = 'block';
    }
}

function toggleDevSelection(devItem) {
    const checkbox = devItem.querySelector('.tag-checkbox');
    const isChecked = checkbox.classList.contains('checked');

    if (isChecked) {
        checkbox.classList.remove('checked');
        checkbox.querySelector('i').style.display = 'none';
    } else {
        checkbox.classList.add('checked');
        checkbox.querySelector('i').style.display = 'block';
    }
    updateDevsButtonText();
}

function updateDevsButtonText() {
    const selectedDevs = getSelectedDevs();
    const button = document.getElementById('devsDropdownButton');
    
    if (selectedDevs.length === 0) {
        button.innerHTML = 'Выберите разработчиков <i class="fas fa-chevron-down"></i>';
        return;
    }

    if (selectedDevs.length <= 3) {
        let html = '';
        selectedDevs.forEach(devKey => {
            const devData = devsConfig[devKey];
            html += `<img src="${devData.logo}" alt="${devData.name}" class="dev-logo">`;
        });
        html += `<i class="fas fa-chevron-down"></i>`;
        button.innerHTML = html;
    } else {
        button.innerHTML = `Выбрано ${selectedDevs.length} разработчиков <i class="fas fa-chevron-down"></i>`;
    }
}

function getSelectedTags() {
    const selectedTags = [];
    document.querySelectorAll('#tagsDropdownMenu .tag-item').forEach((item) => {
        if (item.querySelector('.tag-checkbox').classList.contains('checked')) {
            selectedTags.push(item.getAttribute('data-tag'));
        }
    });
    return selectedTags;
}

function getSelectedDevs() {
    const selectedDevs = [];
    document.querySelectorAll('#devsDropdownMenu .dev-item').forEach((item) => {
        if (item.querySelector('.tag-checkbox').classList.contains('checked')) {
            selectedDevs.push(item.getAttribute('data-dev'));
        }
    });
    return selectedDevs;
}

function saveGame() {
    const gameIdInput = document.getElementById('gameId').value.trim();
    if (!gameIdInput) {
        showMessage('Введите ID игры', 'error');
        return;
    }

    const descriptionHtml = document.getElementById('gameDescriptionRaw').value.trim();

    const gameData = {
        name: document.getElementById('gameName').value.trim(),
        dev: getSelectedDevs(),
        version: document.getElementById('gameVersion').value.trim() || '1.12.2 Forge',
        description: descriptionHtml,
        poster: document.getElementById('gamePoster').value.trim(),
        downloadable: document.getElementById('downloadable').checked,
        tags: getSelectedTags(),
    };

    const notes = document.getElementById('gameNotes').value.trim();
    if (notes) gameData.notes = notes;

    const downloadLink = document.getElementById('downloadLink').value.trim();
    if (downloadLink) gameData.download_link = downloadLink;

    const trailersData = getTrailersData();
    if (trailersData.trailers) {
        gameData['trailers-page'] = trailersData.trailers;
        if (trailersData.mainTrailer) {
            gameData.trailer = trailersData.mainTrailer;
        }
    }

    if (currentEditId) {
        if (currentEditId !== gameIdInput && gamesData[gameIdInput]) {
            showMessage('Игра с таким ID уже существует!', 'error');
            return;
        }
        if (currentEditId !== gameIdInput) {
            delete gamesData[currentEditId];
        }
        gamesData[gameIdInput] = gameData;
        showMessage('Игра обновлена!', 'success');
    } else {
        if (gamesData[gameIdInput]) {
            showMessage('Игра с таким ID уже существует!', 'error');
            return;
        }
        gamesData[gameIdInput] = gameData;
        showMessage('Игра добавлена!', 'success');
    }

    updateFinalJson();
    updateGamesList();

    if (!currentEditId) {
        clearForm();
    }
}

function clearForm() {
    document.getElementById('gameId').value = '';
    document.getElementById('gameName').value = '';
    document.getElementById('gameVersion').value = '';
    document.getElementById('gameDescription').innerHTML = '';
    document.getElementById('gameDescriptionRaw').value = '';
    document.getElementById('gamePoster').value = '';
    document.getElementById('downloadLink').value = '';
    document.getElementById('downloadable').checked = false;
    document.getElementById('gameNotes').value = '';
    document.getElementById('trailersContainer').innerHTML = '';

    document.querySelectorAll('#tagsDropdownMenu .tag-item .tag-checkbox').forEach((checkbox) => {
        checkbox.classList.remove('checked');
        checkbox.querySelector('i').style.display = 'none';
    });

    document.querySelectorAll('#devsDropdownMenu .dev-item .tag-checkbox').forEach((checkbox) => {
        checkbox.classList.remove('checked');
        checkbox.querySelector('i').style.display = 'none';
    });
    updateDevsButtonText();
}

function updateGamesList() {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = '';
    if (Object.keys(gamesData).length === 0) {
        gamesList.innerHTML = '<p>Нет сохранённых игр</p>';
        return;
    }
    
    const gamesArray = Object.entries(gamesData);
    
    gamesArray.forEach(([gameId, game]) => {
        const gameItem = document.createElement('div');
        gameItem.className = 'game-item';
        gameItem.setAttribute('draggable', true);
        
        gameItem.innerHTML = `
            <span><strong>${gameId}</strong>: ${game.name}</span>
            <div class="actions">
                <button class="edit-btn" onclick="editGame('${gameId}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteGame('${gameId}')" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        gameItem.addEventListener('dragstart', handleDragStart);
        gameItem.addEventListener('dragover', handleDragOver);
        gameItem.addEventListener('drop', handleDrop);
        
        gamesList.appendChild(gameItem);
    });
}

let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const target = e.target.closest('.game-item');
    
    if (!target || dragSrcEl === target) {
        return;
    }

    const items = Array.from(document.querySelectorAll('.game-item'));
    const fromIndex = items.indexOf(dragSrcEl);
    const toIndex = items.indexOf(target);

    const newOrder = Object.entries(gamesData);
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    gamesData = Object.fromEntries(newOrder);
    updateGamesList();
    updateFinalJson();
    return false;
}

function editGame(gameId) {
    const game = gamesData[gameId];
    if (!game) return;
    currentEditId = gameId;

    document.getElementById('gameId').value = gameId;
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameVersion').value = game.version || '';
    document.getElementById('gameDescription').innerHTML = game.description || '';
    document.getElementById('gameDescriptionRaw').value = game.description || '';
    document.getElementById('gamePoster').value = game.poster;
    document.getElementById('downloadLink').value = game.download_link || '';
    document.getElementById('downloadable').checked = game.downloadable || false;
    document.getElementById('gameNotes').value = game.notes || '';

    document.getElementById('trailersContainer').innerHTML = '';
    
    if (game['trailers-page']) {
        for (const [trailerKey, trailer] of Object.entries(game['trailers-page'])) {
            const isMain = game.trailer === trailerKey;
            addTrailer({
                name: trailer.name,
                preview: trailer.preview,
                video: trailer.video
            }, isMain);
        }
    } else if (game.trailer && typeof game.trailer === 'object') {
        addTrailer({
            name: game.trailer.name,
            preview: game.trailer.preview,
            video: game.trailer.video
        }, true);
    }

    document.querySelectorAll('#tagsDropdownMenu .tag-item').forEach((item) => {
        const tagKey = item.getAttribute('data-tag');
        const isChecked = game.tags && game.tags.includes(tagKey);
        const checkbox = item.querySelector('.tag-checkbox');
        if (isChecked) {
            checkbox.classList.add('checked');
            checkbox.querySelector('i').style.display = 'block';
        } else {
            checkbox.classList.remove('checked');
            checkbox.querySelector('i').style.display = 'none';
        }
    });

    document.querySelectorAll('#devsDropdownMenu .dev-item').forEach((item) => {
        const devKey = item.getAttribute('data-dev');
        const isChecked = game.dev && game.dev.includes(devKey);
        const checkbox = item.querySelector('.tag-checkbox');
        if (isChecked) {
            checkbox.classList.add('checked');
            checkbox.querySelector('i').style.display = 'block';
        } else {
            checkbox.classList.remove('checked');
            checkbox.querySelector('i').style.display = 'none';
        }
    });
    updateDevsButtonText();

    document.getElementById('formTitle').textContent = 'Редактировать игру';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    document.querySelector('.form-section button[onclick="saveGame()"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteGame(gameId) {
    if (confirm(`Вы уверены, что хотите удалить игру "${gameId}"?`)) {
        delete gamesData[gameId];
        updateFinalJson();
        updateGamesList();
        showMessage(`Игра "${gameId}" удалена!`, 'success');
        if (currentEditId === gameId) {
            cancelEdit();
        }
    }
}

function updateFinalJson() {
    document.getElementById('finalJsonOutput').value = JSON.stringify(gamesData, null, 4);
}

function copyFinalJson() {
    const finalJson = document.getElementById('finalJsonOutput');
    finalJson.select();
    document.execCommand('copy');
    showMessage('JSON скопирован в буфер обмена!', 'success');
}

function cancelEdit() {
    currentEditId = null;
    clearForm();
    document.getElementById('formTitle').textContent = 'Добавить игру';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.querySelector('.form-section button[onclick="saveGame()"]').innerHTML = '<i class="fas fa-plus"></i> Добавить';
}

/* ================ Функции для работы с новостями ================ */

async function loadNewsData() {
    try {
        const response = await fetch('json/news_config.json');
        if (!response.ok) throw new Error('Ошибка загрузки новостей');
        newsData = await response.json();
        updateNewsJson();
        updateNewsList();
        showMessage('Конфиг новостей успешно загружен!', 'success');
    } catch (error) {
        showMessage('Ошибка загрузки конфига новостей: ' + error.message, 'error');
        newsData = { news: [] };
        updateNewsJson();
        updateNewsList();
    }
}

function addCover(coverPath = '') {
    const container = document.getElementById('coversContainer');
    const coverId = Date.now();
    
    const coverHtml = `
        <div class="cover-item" data-id="${coverId}">
            <input type="text" class="cover-path" value="${coverPath}" placeholder="Путь к изображению (например, imgs/banners/1.png)">
            <button class="remove-cover" onclick="removeCover(${coverId})"><i class="fas fa-times"></i> Удалить</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', coverHtml);
}

function removeCover(coverId) {
    const coverElement = document.querySelector(`.cover-item[data-id="${coverId}"]`);
    if (coverElement && confirm('Удалить эту обложку?')) {
        coverElement.remove();
    }
}

function getCoversData() {
    const covers = [];
    document.querySelectorAll('.cover-item').forEach(item => {
        const path = item.querySelector('.cover-path').value.trim();
        if (path) {
            covers.push(path);
        }
    });
    
    // Если обложки не указаны, используем обложку по умолчанию
    if (covers.length === 0) {
        covers.push('imgs/default_cover.png');
    }
    
    return covers;
}

function saveNews() {
    const date = getCurrentDate();
    const title = document.getElementById('newsTitle').value.trim();
    const text = document.getElementById('newsTextRaw').value.trim() || ""; // Пустой текст, если не указан
    
    if (!title) {
        showMessage('Заголовок новости обязателен!', 'error');
        return;
    }
    
    const covers = getCoversData();
    
    const newsItem = {
        date: date,
        title: title,
        covers: covers,
        text: text // Всегда включаем текст, даже если он пустой
    };
    
    if (currentEditNewsIndex !== null) {
        newsData.news[currentEditNewsIndex] = newsItem;
        showMessage('Новость обновлена!', 'success');
    } else {
        // Добавляем новость в начало массива
        newsData.news.unshift(newsItem);
        showMessage('Новость добавлена!', 'success');
    }
    
    updateNewsJson();
    updateNewsList();
    
    if (currentEditNewsIndex === null) {
        clearNewsForm();
    }
}

function updateNewsList() {
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = '';
    
    if (newsData.news.length === 0) {
        newsList.innerHTML = '<p>Нет сохранённых новостей</p>';
        return;
    }
    
    newsData.news.forEach((news, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        newsItem.innerHTML = `
            <div class="date">${news.date}</div>
            <h4>${news.title}</h4>
            ${news.text ? `<div class="news-preview">${news.text.substring(0, 100)}${news.text.length > 100 ? '...' : ''}</div>` : ''}
            <div class="actions">
                <button onclick="editNews(${index})"><i class="fas fa-edit"></i> Редактировать</button>
                <button onclick="deleteNews(${index})" class="delete-btn"><i class="fas fa-trash"></i> Удалить</button>
            </div>
        `;
        
        newsList.appendChild(newsItem);
    });
}

function editNews(index) {
    const news = newsData.news[index];
    if (!news) return;
    
    currentEditNewsIndex = index;
    
    document.getElementById('newsTitle').value = news.title;
    document.getElementById('newsText').innerHTML = news.text || '';
    document.getElementById('newsTextRaw').value = news.text || '';
    
    document.getElementById('coversContainer').innerHTML = '';
    if (news.covers && news.covers.length > 0) {
        news.covers.forEach(cover => {
            addCover(cover);
        });
    } else {
        // Добавляем обложку по умолчанию, если нет других
        addCover('imgs/default_cover.png');
    }
    
    document.getElementById('newsFormTitle').textContent = 'Редактировать новость';
    document.getElementById('cancelNewsEditBtn').style.display = 'inline-block';
    document.querySelector('.news-editor button[onclick="saveNews()"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
    document.querySelector('.news-editor').scrollIntoView({ behavior: 'smooth' });
}

function deleteNews(index) {
    if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        newsData.news.splice(index, 1);
        updateNewsJson();
        updateNewsList();
        showMessage('Новость удалена!', 'success');
        
        if (currentEditNewsIndex === index) {
            cancelNewsEdit();
        } else if (currentEditNewsIndex > index) {
            currentEditNewsIndex--;
        }
    }
}

function updateNewsJson() {
    document.getElementById('newsJsonOutput').value = JSON.stringify(newsData, null, 4);
}

function copyNewsJson() {
    const newsJson = document.getElementById('newsJsonOutput');
    newsJson.select();
    document.execCommand('copy');
    showMessage('JSON новостей скопирован в буфер обмена!', 'success');
}

function cancelNewsEdit() {
    currentEditNewsIndex = null;
    clearNewsForm();
    document.getElementById('newsFormTitle').textContent = 'Добавить новость';
    document.getElementById('cancelNewsEditBtn').style.display = 'none';
    document.querySelector('.news-editor button[onclick="saveNews()"]').innerHTML = '<i class="fas fa-plus"></i> Добавить';
}

function clearNewsForm() {
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsText').innerHTML = '';
    document.getElementById('newsTextRaw').value = '';
    document.getElementById('coversContainer').innerHTML = '';
    // Добавляем поле для обложки по умолчанию
    addCover('imgs/default_cover.png');
}

/* ================ Функции для работы с разработчиками ================ */

function addContact(contactUrl = '') {
    const container = document.getElementById('contactsContainer');
    const contactId = Date.now();
    
    const contactHtml = `
        <div class="contact-item" data-id="${contactId}">
            <input type="text" class="contact-url" value="${contactUrl}" placeholder="URL контакта (например, https://t.me/mijastervibe)">
            <button class="remove-contact" onclick="removeContact(${contactId})"><i class="fas fa-times"></i> Удалить</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', contactHtml);
}

function removeContact(contactId) {
    const contactElement = document.querySelector(`.contact-item[data-id="${contactId}"]`);
    if (contactElement && confirm('Удалить этот контакт?')) {
        contactElement.remove();
    }
}

function addScreen(screenPath = '') {
    const container = document.getElementById('screensContainer');
    const screenId = Date.now();
    
    const screenHtml = `
        <div class="screen-item" data-id="${screenId}">
            <input type="text" class="screen-path" value="${screenPath}" placeholder="Путь к скриншоту (например, devs/ms/screens/1.png)">
            <button class="remove-screen" onclick="removeScreen(${screenId})"><i class="fas fa-times"></i> Удалить</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', screenHtml);
}

function removeScreen(screenId) {
    const screenElement = document.querySelector(`.screen-item[data-id="${screenId}"]`);
    if (screenElement && confirm('Удалить этот скриншот?')) {
        screenElement.remove();
    }
}

function changeBgType() {
    const bgType = document.getElementById('bgType').value;
    if (bgType === 'color') {
        document.getElementById('colorPicker').style.display = 'block';
        document.getElementById('gradientPicker').style.display = 'none';
    } else {
        document.getElementById('colorPicker').style.display = 'none';
        document.getElementById('gradientPicker').style.display = 'block';
    }
    updateBgPreview();
}

function addGradientStop(color = '#ffffff', position = 50) {
    const stopsContainer = document.getElementById('gradientStops');
    const stopId = Date.now();
    
    const stopHtml = `
        <div class="gradient-stop" data-id="${stopId}">
            <input type="color" value="${color}" onchange="updateBgPreview()">
            <input type="range" min="0" max="100" value="${position}" onchange="updateBgPreview()">
            <span>${position}%</span>
            <button class="remove-gradient-stop" onclick="removeGradientStop(${stopId})"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    stopsContainer.insertAdjacentHTML('beforeend', stopHtml);
    updateBgPreview();
}

function removeGradientStop(stopId) {
    const stopElement = document.querySelector(`.gradient-stop[data-id="${stopId}"]`);
    if (stopElement) {
        stopElement.remove();
        updateBgPreview();
    }
}

function updateBgPreview() {
    const bgType = document.getElementById('bgType').value;
    const preview = document.getElementById('gradientPreview');
    const colorPreview = document.getElementById('colorPreview');
    
    if (bgType === 'color') {
        const color = document.getElementById('devBgColor').value;
        document.getElementById('devBgColorText').value = color;
        colorPreview.style.backgroundColor = color;
        preview.style.background = color;
    } else {
        const angle = document.getElementById('gradientAngle').value;
        const stops = Array.from(document.querySelectorAll('.gradient-stop')).map(stop => {
            const color = stop.querySelector('input[type="color"]').value;
            const position = stop.querySelector('input[type="range"]').value;
            stop.querySelector('span').textContent = `${position}%`;
            return `${color} ${position}%`;
        });
        
        if (stops.length === 0) {
            preview.style.background = 'linear-gradient(180deg, #000000 0%, #ffffff 100%)';
        } else {
            preview.style.background = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
        }
    }
}

function updateBgColorFromText() {
    const colorText = document.getElementById('devBgColorText').value;
    // Проверяем, является ли введенное значение допустимым цветом
    if (/^#[0-9A-F]{6}$/i.test(colorText)) {
        document.getElementById('devBgColor').value = colorText;
        document.getElementById('colorPreview').style.backgroundColor = colorText;
        updateBgPreview();
    } else {
        showMessage('Введите цвет в формате HEX (#000000)', 'error');
    }
}

// Добавим обработчик клика на превью цвета
document.getElementById('colorPreview').addEventListener('click', function() {
    document.getElementById('devBgColor').click();
});

function getBgValue() {
    const bgType = document.getElementById('bgType').value;
    
    if (bgType === 'color') {
        return document.getElementById('devBgColor').value;
    } else {
        const angle = document.getElementById('gradientAngle').value;
        const stops = Array.from(document.querySelectorAll('.gradient-stop')).map(stop => {
            const color = stop.querySelector('input[type="color"]').value;
            const position = stop.querySelector('input[type="range"]').value;
            return `${color} ${position}%`;
        });
        
        if (stops.length === 0) {
            return 'linear-gradient(180deg, #000000 0%, #ffffff 100%)';
        }
        
        return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    }
}

function setBgValue(value) {
    if (value.startsWith('linear-gradient')) {
        document.getElementById('bgType').value = 'gradient';
        changeBgType();
        
        // Парсим градиент
        const matches = value.match(/linear-gradient\((\d+)deg, (.*)\)/);
        if (matches) {
            const angle = matches[1];
            const stopsStr = matches[2];
            
            document.getElementById('gradientAngle').value = angle;
            document.getElementById('gradientStops').innerHTML = '';
            
            const stops = stopsStr.split(', ');
            stops.forEach(stop => {
                const [color, position] = stop.split(' ');
                const pos = parseInt(position);
                addGradientStop(color, isNaN(pos) ? 50 : pos);
            });
        }
    } else {
        document.getElementById('bgType').value = 'color';
        changeBgType();
        document.getElementById('devBgColor').value = value;
        document.getElementById('devBgColorText').value = value;
        document.getElementById('colorPreview').style.backgroundColor = value;
    }
    updateBgPreview();
}

function saveDev() {
    const devId = document.getElementById('devId').value.trim();
    if (!devId) {
        showMessage('Введите ID разработчика', 'error');
        return;
    }

    // Автоматически добавляем префикс devs/ к путям файлов
    const logoPath = document.getElementById('devLogo').value.trim();
    const bannerPath = document.getElementById('devBanner').value.trim();
    
    const contacts = [];
    document.querySelectorAll('.contact-item').forEach(item => {
        const url = item.querySelector('.contact-url').value.trim();
        if (url) contacts.push(url);
    });

    const screens = [];
    document.querySelectorAll('.screen-item').forEach(item => {
        const path = item.querySelector('.screen-path').value.trim();
        if (path) {
            // Автоматически добавляем путь к скриншотам
            const fullPath = path.startsWith('devs/') ? path : `devs/${devId}/screens/${path}`;
            screens.push(fullPath);
        }
    });

    const devData = {
        name: document.getElementById('devName').value.trim(),
        logo: logoPath.startsWith('devs/') ? logoPath : `devs/${devId}/${logoPath}`,
        banner: bannerPath ? (bannerPath.startsWith('devs/') ? bannerPath : `devs/${devId}/${bannerPath}`) : undefined,
        description: document.getElementById('devDescriptionRaw').value.trim() || undefined,
        contacts: contacts.length > 0 ? contacts : undefined,
        screens: screens.length > 0 ? screens : undefined,
        data: document.getElementById('devData').value.trim() || undefined,
        bg: getBgValue()
    };

    if (currentEditDevId) {
        if (currentEditDevId !== devId && devsConfig[devId]) {
            showMessage('Разработчик с таким ID уже существует!', 'error');
            return;
        }
        if (currentEditDevId !== devId) {
            delete devsConfig[currentEditDevId];
        }
        devsConfig[devId] = devData;
        showMessage('Разработчик обновлен!', 'success');
    } else {
        if (devsConfig[devId]) {
            showMessage('Разработчик с таким ID уже существует!', 'error');
            return;
        }
        // Добавляем в конец объекта
        const newDevsConfig = {...devsConfig};
        newDevsConfig[devId] = devData;
        devsConfig = newDevsConfig;
        showMessage('Разработчик добавлен!', 'success');
    }

    updateDevsJson();
    updateDevsList();

    if (!currentEditDevId) {
        clearDevForm();
    }
}

function updateDevsList() {
    const devsList = document.getElementById('devsList');
    devsList.innerHTML = '';
    
    if (Object.keys(devsConfig).length === 0) {
        devsList.innerHTML = '<p>Нет сохранённых разработчиков</p>';
        return;
    }
    
    for (const [devId, dev] of Object.entries(devsConfig)) {
        const devItem = document.createElement('div');
        devItem.className = 'dev-item';
        
        devItem.innerHTML = `
            <div class="dev-item-header">
                <img src="${dev.logo}" alt="${dev.name}" class="dev-logo-small">
                <div class="dev-item-info">
                    <span class="dev-id">${devId}</span>
                    <span class="dev-name">${dev.name}</span>
                </div>
            </div>
            <div class="actions">
                <button onclick="editDev('${devId}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button onclick="deleteDev('${devId}')" class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        devsList.appendChild(devItem);
    }
}

function editDev(devId) {
    const dev = devsConfig[devId];
    if (!dev) return;
    
    currentEditDevId = devId;
    
    document.getElementById('devId').value = devId;
    document.getElementById('devName').value = dev.name;
    
    // Убираем префикс devs/id/ для отображения в форме
    document.getElementById('devLogo').value = dev.logo.replace(`devs/${devId}/`, '');
    document.getElementById('devBanner').value = dev.banner ? dev.banner.replace(`devs/${devId}/`, '') : '';
    
    document.getElementById('devDescription').innerHTML = dev.description || '';
    document.getElementById('devDescriptionRaw').value = dev.description || '';
    document.getElementById('devData').value = dev.data || '';
    
    document.getElementById('contactsContainer').innerHTML = '';
    if (dev.contacts && dev.contacts.length > 0) {
        dev.contacts.forEach(contact => {
            addContact(contact);
        });
    }
    
    document.getElementById('screensContainer').innerHTML = '';
    if (dev.screens && dev.screens.length > 0) {
        dev.screens.forEach(screen => {
            // Убираем префикс devs/id/screens/ для отображения в форме
            const screenName = screen.replace(`devs/${devId}/screens/`, '');
            addScreen(screenName);
        });
    }
    
    if (dev.bg) {
        setBgValue(dev.bg);
    } else {
        setBgValue('#000000');
    }
    
    document.getElementById('devsFormTitle').textContent = 'Редактировать разработчика';
    document.getElementById('cancelDevEditBtn').style.display = 'inline-block';
    document.querySelector('.devs-editor button[onclick="saveDev()"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
    document.querySelector('.devs-editor').scrollIntoView({ behavior: 'smooth' });
}

function deleteDev(devId) {
    if (confirm(`Вы уверены, что хотите удалить разработчика "${devId}"?`)) {
        delete devsConfig[devId];
        updateDevsJson();
        updateDevsList();
        showMessage(`Разработчик "${devId}" удален!`, 'success');
        if (currentEditDevId === devId) {
            cancelDevEdit();
        }
    }
}

function updateDevsJson() {
    document.getElementById('devsJsonOutput').value = JSON.stringify(devsConfig, null, 4);
}

function copyDevsJson() {
    const devsJson = document.getElementById('devsJsonOutput');
    devsJson.select();
    document.execCommand('copy');
    showMessage('JSON разработчиков скопирован в буфер обмена!', 'success');
}

function cancelDevEdit() {
    currentEditDevId = null;
    clearDevForm();
    document.getElementById('devsFormTitle').textContent = 'Добавить разработчика';
    document.getElementById('cancelDevEditBtn').style.display = 'none';
    document.querySelector('.devs-editor button[onclick="saveDev()"]').innerHTML = '<i class="fas fa-plus"></i> Добавить';
}

function clearDevForm() {
    document.getElementById('devId').value = '';
    document.getElementById('devName').value = '';
    document.getElementById('devLogo').value = 'icon.svg'; // По умолчанию
    document.getElementById('devBanner').value = 'banner.mp4'; // По умолчанию
    document.getElementById('devDescription').innerHTML = '';
    document.getElementById('devDescriptionRaw').value = '';
    document.getElementById('devData').value = '';
    document.getElementById('contactsContainer').innerHTML = '';
    document.getElementById('screensContainer').innerHTML = '';
    setBgValue('#000000'); // Черный цвет по умолчанию
    addContact();
    addScreen();
}

// Общая функция для отображения сообщений
function showMessage(text, type) {
    const msg = document.getElementById('statusMessage');
    msg.textContent = text;
    msg.className = type;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
}

// Обработчик события dragend для игр
document.getElementById('gamesList').addEventListener('dragend', function(e) {
    const item = e.target.closest('.game-item');
    if (item) {
        item.classList.remove('dragging');
    }
});