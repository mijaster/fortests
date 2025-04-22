document.addEventListener('DOMContentLoaded', function () {
    fetch('json/games_config.json')
        .then(response => response.json())
        .then(data => {
            const videosContainer = document.getElementById('videos-container');
            const dropdownMenu = document.getElementById('dropdown-menu');
            const dropdownToggle = document.getElementById('dropdown-toggle');
            const selectedGame = document.getElementById('selected-game');

            // Массив для хранения уникальных названий игр
            const gamesList = [];

            for (const gameId in data) {
                const game = data[gameId];

                // Добавляем игру в список, если она имеет трейлеры
                if (game['trailers-page'] || game.trailer) {
                    gamesList.push({ id: gameId, name: game.name });
                }

                // Создаем видеоплееры для трейлеров
                if (game['trailers-page']) {
                    for (const trailerId in game['trailers-page']) {
                        const trailer = game['trailers-page'][trailerId];
                        createVideoPlayer(gameId, game, trailer, videosContainer);
                    }
                } else if (game.trailer) {
                    createVideoPlayer(gameId, game, game.trailer, videosContainer);
                }
            }

            // Заполняем выпадающее меню
            populateDropdown(gamesList, dropdownMenu);

            // Обработчик клика по кнопке выпадающего меню
            dropdownToggle.addEventListener('click', () => {
                dropdownMenu.classList.toggle('active');
                dropdownToggle.classList.toggle('active');
            });

            // Обработчик клика по элементам меню
            dropdownMenu.addEventListener('click', handleGameSelection);

            // Обработчик клика вне выпадающего меню
            document.addEventListener('click', (event) => {
                if (!dropdownMenu.contains(event.target) && !dropdownToggle.contains(event.target)) {
                    dropdownMenu.classList.remove('active');
                    dropdownToggle.classList.remove('active');
                }
            });

            // Инициализация видеоплееров после загрузки
            if (typeof initVideoPlayers === 'function') {
                initVideoPlayers();
            }

            // Добавляем обработчики для кнопок "об игре"
            setupGameInfoButtons();
        })
        .catch(error => {
            console.error('Error loading trailers:', error);
        });
});

// Функция для заполнения выпадающего меню
function populateDropdown(gamesList, dropdownMenu) {
    // Добавляем кнопку "ВСЕ"
    const allButton = document.createElement('button');
    allButton.textContent = 'ВСЕ';
    allButton.setAttribute('data-game-id', 'all');
    dropdownMenu.appendChild(allButton);

    // Добавляем кнопки для каждой игры
    gamesList.forEach(game => {
        const button = document.createElement('button');
        button.textContent = game.name;
        button.setAttribute('data-game-id', game.id);
        dropdownMenu.appendChild(button);
    });
}

// Функция для обработки выбора игры
function handleGameSelection(event) {
    if (!event.target.tagName === 'BUTTON') return;

    const selectedGameId = event.target.getAttribute('data-game-id');
    const videoPlayers = document.querySelectorAll('.video-player');
    const selectedGame = document.getElementById('selected-game');

    // Обновляем текст на кнопке
    selectedGame.textContent = event.target.textContent;

    // Скрываем/показываем трейлеры
    let hasTrailers = false; // Флаг для проверки наличия трейлеров
    videoPlayers.forEach(player => {
        const gameId = player.querySelector('video').id.split('_')[0];
        if (selectedGameId === 'all' || gameId === selectedGameId) {
            player.style.display = 'block';
            hasTrailers = true; // Устанавливаем флаг, если есть хотя бы один трейлер
        } else {
            player.style.display = 'none';
        }
    });

    // Если трейлеров нет, показываем сообщение
    const videosContainer = document.getElementById('videos-container');
    if (!hasTrailers) {
        showNoTrailersMessage(videosContainer);
    } else {
        // Удаляем сообщение, если оно уже отображалось
        const existingMessage = videosContainer.querySelector('.no-trailers-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Закрываем выпадающее меню
    const dropdownMenu = document.getElementById('dropdown-menu');
    dropdownMenu.classList.remove('active');
    const dropdownToggle = document.getElementById('dropdown-toggle');
    dropdownToggle.classList.remove('active');
}

// Функция для создания видеоплеера
function createVideoPlayer(gameId, game, trailer, container) {
    const videoPlayer = document.createElement('div');
    videoPlayer.className = 'video-player fade-in-up';

    // Устанавливаем атрибут data-game-id для фильтрации
    videoPlayer.setAttribute('data-game-id', gameId);

    videoPlayer.innerHTML = `
        <div class="pause-preview" style="background-image: url('games/${gameId}/previews/${trailer.preview}');"></div>
        <div class="pause-icon"><i class="fas fa-play"></i></div>
        <video id="${gameId}_${trailer.video.split('.')[0]}" preload="metadata" poster="games/${gameId}/previews/${trailer.preview}">
            <source src="games/${gameId}/trailers/${trailer.video}" type="video/mp4">
        </video>
        <div class="video-info-overlay">
            <h3 class="video-title">${trailer.name}</h3>
        </div>
        <a href="#" class="more-info-btn" data-game-id="${gameId}">на страницу игры</a>
        <div class="custom-controls">
            <button class="control-btn play-pause-btn"><i class="fas fa-play"></i></button>
            <input type="range" class="progress-slider" value="0" min="0" max="100">
            <span class="time-display">0:00 / 0:00</span>
            <div class="volume-controls">
                <i class="fas fa-volume-up volume-icon"></i>
                <input type="range" class="volume-slider" value="100" min="0" max="100">
            </div>
            <button class="control-btn fullscreen-btn"><i class="fas fa-expand"></i></button>
        </div>
    `;

    container.appendChild(videoPlayer);
}

// Функция для отображения сообщения об отсутствии трейлеров
function showNoTrailersMessage(container) {
    // Удаляем предыдущее сообщение, если оно уже существует
    const existingMessage = container.querySelector('.no-trailers-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Создаем новое сообщение
    const message = document.createElement('div');
    message.className = 'no-trailers-message';
    message.innerHTML = `
        <i class="fa-solid fa-face-sad-cry"></i>
        <p>Видимо, у этой игры нет трейлеров</p>
    `;
    container.appendChild(message);
}

// Функция для настройки кнопок "об игре"
function setupGameInfoButtons() {
    const infoButtons = document.querySelectorAll('.more-info-btn');

    infoButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const gameId = this.getAttribute('data-game-id');

            if (gameId) {
                // Сохраняем текущую позицию прокрутки
                sessionStorage.setItem('scrollPosition', window.scrollY);

                // Перенаправляем на страницу игры с нужным gameId
                window.location.href = `game.html?gameId=${gameId}`;
            }
        });
    });
}