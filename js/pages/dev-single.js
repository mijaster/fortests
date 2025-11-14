document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const devId = urlParams.get('devId');

    if (!devId) {
        console.error('No developer ID specified in URL');
        return;
    }

    try {
        const [devsConfig, gamesConfig, tagsConfig] = await Promise.all([
            fetch('json/devs_config.json').then(res => res.json()),
            fetch('json/games_config.json').then(res => res.json()),
            fetch('json/tags_config.json').then(res => res.json())
        ]);

        const devData = devsConfig[devId];
        if (!devData) {
            console.error(`Developer with ID ${devId} not found`);
            return;
        }

        // Функция для затемнения цвета
        function darkenColor(color, percent) {
            // Если это градиент, возвращаем как есть
            if (typeof color !== 'string' || color.includes('gradient')) return color;
            
            try {
                // Создаём временный элемент для парсинга цвета
                const tempEl = document.createElement('div');
                tempEl.style.color = color;
                document.body.appendChild(tempEl);
                
                // Получаем вычисленный цвет в rgb формате
                const computed = getComputedStyle(tempEl).color;
                document.body.removeChild(tempEl);
                
                // Парсим rgb/rgba
                const parts = computed.match(/\d+/g).map(Number);
                if (!parts || parts.length < 3) return color;
                
                const [r, g, b] = parts;
                const a = parts.length > 3 ? parts[3] : 1;
                
                // Затемняем
                const amt = Math.round(2.55);
                const newR = Math.max(0, r - amt);
                const newG = Math.max(0, g - amt);
                const newB = Math.max(0, b - amt);
                
                return a === 1 
                    ? `rgb(${newR}, ${newG}, ${newB})`
                    : `rgba(${newR}, ${newG}, ${newB}, ${a})`;
            } catch (e) {
                console.error('Error processing color:', e);
                return color;
            }
        }

        // Установка фона
        const bgColor = devData.bg || '#000000';
        const darkerBgColor = darkenColor(bgColor, 30); // Затемняем на 30%
        
        // Применяем фон к body и .dev-container
        document.body.style.backgroundColor = darkerBgColor;
        document.querySelector('.dev-container').style.backgroundColor = darkerBgColor;
        
        // Если это градиент, применяем как есть (без затемнения)
        if (bgColor.includes('gradient')) {
            document.body.style.background = bgColor;
            document.querySelector('.dev-container').style.background = bgColor;
        }

        // Остальной код остается без изменений
        // 1. Логотип и название (ОТОБРАЖАЮТСЯ ВСЕГДА)
        const logoImg = document.querySelector('.logo-dev');
        const devNameEl = document.querySelector('.dev-name');
        document.title = `Разработчик ${devData.name.toUpperCase()}`;
        logoImg.src = devData.logo || ''; // Заглушка, если лого нет
        logoImg.alt = ``;
        devNameEl.textContent = devData.name;

        // 2. Баннер (поддержка видео и изображений)
        const bannerContainer = document.querySelector('.banner-container');
        const bannerMediaContainer = document.createElement('div');
        bannerMediaContainer.className = 'banner-media';

        // В dev-single.js изменяем только обработку баннера
        if (devData.banner) {
            const isVideoBanner = devData.banner.endsWith('.mp4');
            const bannerContainer = document.querySelector('.banner-container');
            
            if (isVideoBanner) {
                // Видео-баннер
                const videoBanner = document.createElement('video');
                videoBanner.className = 'banner-video';
                videoBanner.autoplay = true;
                videoBanner.loop = true;
                videoBanner.muted = true;
                videoBanner.playsInline = true;
                videoBanner.innerHTML = `<source src="${devData.banner}" type="video/mp4">`;
                bannerContainer.appendChild(videoBanner);
                
                // Стили для видео
                videoBanner.style.width = '100%';
                videoBanner.style.height = '100%';
                videoBanner.style.objectFit = 'cover';
            } else {
                // Обычный изображение-баннер
                const imgBanner = document.createElement('img');
                imgBanner.src = devData.banner;
                imgBanner.className = 'banner-img';
                imgBanner.alt = ``;
                bannerContainer.appendChild(imgBanner);
            }
        }
        // Если баннера нет, контейнер останется пустым и будет скрыт CSS

        // 3. Описание (если нет — скрываем)
        const descriptionEl = document.querySelector('.description');
        if (devData.description) {
            descriptionEl.innerHTML = devData.description;
        } else {
            descriptionEl.style.display = 'none';
        }

        // 4. Контакты (если нет — скрываем)
        const contactsContainer = document.querySelector('.contacts');
        if (devData.contacts && devData.contacts.length > 0) {
            contactsContainer.innerHTML = '';
            devData.contacts.forEach(contact => {
                const contactLink = document.createElement('a');
                contactLink.href = contact;
                contactLink.target = '_blank';
                contactLink.rel = 'noopener noreferrer';
                contactLink.className = 'shake';

                let iconClass;
                if (contact.includes('t.me')) iconClass = 'fab fa-telegram';
                else if (contact.includes('discord.gg')) iconClass = 'fab fa-discord';
                else if (contact.includes('youtube.com')) iconClass = 'fab fa-youtube';
                else iconClass = 'fas fa-link';

                contactLink.innerHTML = `<i class="${iconClass}"></i>`;
                contactsContainer.appendChild(contactLink);
            });
        } else {
            contactsContainer.style.display = 'none';
        }

        // 5. Скриншоты (если нет — скрываем)
        const screensContainer = document.querySelector('.screens-container');
        const screensTrack = document.querySelector('.screens-track');
        if (devData.screens && devData.screens.length > 0) {
        screensTrack.innerHTML = '';
        devData.screens.forEach((screen, index) => {
            const img = document.createElement('img');
            img.src = screen;
            img.alt = ``;
            img.className = 'screen';
            // Добавляем анимацию появления с задержкой
            setTimeout(() => {
                img.classList.add('show', 'fade-in-screen');
            }, index * 150); // Задержка между анимациями
            screensTrack.appendChild(img);
        });
        // Дублирование для бесконечной прокрутки
        screensTrack.innerHTML += screensTrack.innerHTML;

        // Эффекты при наведении
        document.querySelectorAll('.screen').forEach(screen => {
            screen.addEventListener('mouseenter', () => {
                screen.style.transform = 'scale(1.08)';
                screen.style.zIndex = '10';
                screen.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5)';
            });
            screen.addEventListener('mouseleave', () => {
                screen.style.transform = 'scale(1)';
                screen.style.zIndex = '1';
                screen.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
            });
        });
    } else {
        screensContainer.style.display = 'none';
    }

        // 6. Дата (всегда отображается, но текст зависит от наличия данных)
        const dataEl = document.querySelector('.data');
        
        dataEl.textContent = devData.data
            ? dataEl.style.textAlign = 'right'
            : dataEl.style.textAlign = 'center';
        dataEl.textContent = devData.data 
            ? `*Данные ${devData.data} года` 
            : '';

        // 7. Совместные игры (если нет — скрываем блок)
        const gamesTitle = document.querySelector('.games-title');
        const gamesContainer = document.querySelector('.games-container');
        const gamesSection = document.querySelector('.games-section');
        const jointGames = Object.entries(gamesConfig)
            .filter(([_, game]) => game.dev.includes(devId))
            .map(([id, game]) => ({ id, ...game }));
        
        if (jointGames.length > 0 && devData.name != "Mijaster Studios") {
            gamesTitle.textContent = `Совместные игры с MIJASTER STUDIOS`;
            gamesContainer.innerHTML = '';
            
            jointGames.forEach((game, index) => {
                const gameCard = document.createElement('a');
                gameCard.className = `game scale-in anim-delay-${index + 3}`;
                gameCard.href = `game.html?gameId=${game.id}`;
                
                // Проверяем, является ли постер видео (.mp4)
                if (game.poster) {
                    const posterPath = `games/${game.id}/${game.poster}`;
                    const isVideo = game.poster.endsWith('.mp4');
                    
                    if (isVideo) {
                        // Создаем видео-постер
                        const videoPoster = document.createElement('video');
                        videoPoster.className = 'poster';
                        videoPoster.autoplay = true;
                        videoPoster.loop = true;
                        videoPoster.muted = true;
                        videoPoster.playsInline = true;
                        videoPoster.innerHTML = `<source src="${posterPath}" type="video/mp4">`;
                        gameCard.appendChild(videoPoster);
                        
                        // Добавляем стили для плавности
                        videoPoster.style.width = '100%';
                        videoPoster.style.height = '100%';
                        videoPoster.style.objectFit = 'cover';
                        videoPoster.style.borderRadius = '15px';
                    } else {
                        // Обычный изображение-постер
                        const posterImg = document.createElement('img');
                        posterImg.src = posterPath;
                        posterImg.className = 'poster';
                        posterImg.alt = ``;
                        gameCard.appendChild(posterImg);
                    }
                }
                
                // Оверлей и название
                const overlay = document.createElement('div');
                overlay.className = 'overlay';
                gameCard.appendChild(overlay);
                
                const nameEl = document.createElement('p');
                nameEl.className = 'name';
                nameEl.textContent = game.name;
                gameCard.appendChild(nameEl);
                
                // Теги
                if (game.tags && game.tags.length > 0) {
                    const tagsList = document.createElement('ul');
                    tagsList.className = 'tags';
                    
                    game.tags.forEach((tagId, tagIndex) => {
                        const tagData = tagsConfig[tagId];
                        if (tagData) {
                            const tagItem = document.createElement('li');
                            tagItem.className = `tag-bounce anim-delay-${tagIndex + 4}`;
                            tagItem.innerHTML = `<i class="fas fa-${tagData.icon}"></i><p>${tagData.name}</p>`;
                            tagsList.appendChild(tagItem);
                        }
                    });
                    gameCard.appendChild(tagsList);
                }
                
                gamesContainer.appendChild(gameCard);
            });
        } else {
            gamesSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelector('.data').textContent = '*Ошибка загрузки данных';
    }
});