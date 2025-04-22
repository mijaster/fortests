document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Загружаем конфиги
        const [gamesConfig, tagsConfig] = await Promise.all([
            fetch('json/games_config.json').then(res => res.json()),
            fetch('json/tags_config.json').then(res => res.json())
        ]);

        const gamesContainer = document.querySelector('.games-container');
        const tagsFilterContainer = document.getElementById('tags-filter');
        const mobileTagsMenu = document.querySelector('.mobile-tags-menu');
        const mobileToggle = document.querySelector('.mobile-tags-toggle');
        
        // Очищаем контейнеры
        gamesContainer.innerHTML = '';
        tagsFilterContainer.innerHTML = '';
        mobileTagsMenu.innerHTML = '';

        // Функция создания кнопки тега
        function createTagButton(tagId, tagData) {
            const tagButton = document.createElement('button');
            tagButton.className = 'tag-filter-button';
            tagButton.dataset.tagId = tagId;
            tagButton.innerHTML = `
                <i class="fas fa-${tagData.icon}"></i>
                <span>${tagData.name}</span>
            `;
            
            tagButton.addEventListener('click', function() {
                this.classList.toggle('active');
                filterGames();
            });
            
            return tagButton;
        }

        // Создаем кнопки фильтра по тегам
        for (const [tagId, tagData] of Object.entries(tagsConfig)) {
            const tagButton = createTagButton(tagId, tagData);
            tagsFilterContainer.appendChild(tagButton);
            
            // Копируем кнопку в мобильное меню
            const mobileTagButton = createTagButton(tagId, tagData);
            mobileTagsMenu.appendChild(mobileTagButton);
        }

        // Функция для фильтрации игр по тегам
        function filterGames() {
            const activeTags = Array.from(document.querySelectorAll('.tag-filter-button.active'))
                .map(btn => btn.dataset.tagId);
            
            const games = document.querySelectorAll('.game');
            
            games.forEach(game => {
                const gameTags = Array.from(game.querySelectorAll('.tags li')).map(li => {
                    return li.dataset.tag;
                });
                
                const shouldShow = activeTags.length === 0 || 
                    activeTags.some(tag => gameTags.includes(tag));
                
                if (shouldShow) {
                    game.style.display = 'block';
                    game.style.opacity = '1';
                } else {
                    game.style.display = 'none';
                }
            });
        }

        // Функция для создания постера (изображение или видео)
        function createPosterElement(gameId, gameData) {
            const posterPath = `games/${gameId}/${gameData.posterInList || gameData.poster}`;
            
            // Проверяем, является ли постер видеофайлом
            if (posterPath.toLowerCase().endsWith('.mp4')) {
                const video = document.createElement('video');
                video.src = posterPath;
                video.muted = true;
                video.autoplay = true;
                video.loop = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.style.borderRadius = '20px';
                return video;
            } else {
                const img = document.createElement('img');
                img.src = posterPath;
                img.alt = gameData.name;
                img.className = 'poster';
                return img;
            }
        }

        // Создаем карточки для каждой игры
        for (const [gameId, gameData] of Object.entries(gamesConfig)) {
            const gameCard = document.createElement('a');
            gameCard.className = 'game';
            gameCard.dataset.gameId = gameId;
            gameCard.href = `game.html?gameId=${gameId}`;
            
            // Создаем теги
            const tagsHTML = gameData.tags.map(tagId => {
                const tagConfig = tagsConfig[tagId];
                return tagConfig ? `
                    <li data-tag="${tagId}">
                        <i class="fas fa-${tagConfig.icon}"></i>
                        <p>${tagConfig.name}</p>
                    </li>
                ` : '';
            }).join('');

            // Создаем элемент постера (изображение или видео)
            const posterElement = createPosterElement(gameId, gameData);

            // Заполняем карточку
            gameCard.innerHTML = `
                <div class="overlay"></div>
                <p class="name">${gameData.name}</p>
                <ul class="tags">${tagsHTML}</ul>
            `;
            
            // Вставляем постер первым элементом
            gameCard.insertBefore(posterElement, gameCard.firstChild);

            gamesContainer.appendChild(gameCard);
        }

        // Инициализируем анимации
        const games = document.querySelectorAll('.game');
        games.forEach((game, index) => {
            game.style.animationDelay = `${0.2 + index * 0.2}s`;
        });

        // Обработчик для мобильного меню
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            mobileTagsMenu.classList.toggle('active');
        });
        
        // Закрываем меню при клике вне его
        document.addEventListener('click', function() {
            mobileToggle.classList.remove('active');
            mobileTagsMenu.classList.remove('active');
        });
        
        // Предотвращаем закрытие при клике внутри меню
        mobileTagsMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
    }
});