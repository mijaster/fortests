document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('json/games.json');
        const gamesData = await response.json();
        
        const currentPage = window.location.pathname.split('/').pop();
        const urlParams = new URLSearchParams(window.location.search);
        const devId = urlParams.get('id');

        const isDevPage = currentPage === 'dev-single.html';
        const showOnlyCollabWithMs = isDevPage && devId !== 'ms';

        const projects = gamesData.projects;
        const tagsList = gamesData.tags;

        const now = Date.now();

        const validGames = Object.entries(projects)
            .filter(([id, game]) => game.indexPage?.backgroundPath)
            .map(([id, game]) => ({ id, ...game }))
            .filter(game => {
                const revealDate = parseAsMskTime(game.revealDate);
                if (isNaN(revealDate)) return false;
                const isReleased = revealDate <= now;
                
                if (!isReleased && !game.id.startsWith('!secret')) {
                    return false;
                }

                if (isDevPage) {
                    const devs = Array.isArray(game.dev) ? game.dev : [];
                    return devs.includes(devId);
                }
                if (showOnlyCollabWithMs) {
                    const devs = Array.isArray(game.dev) ? game.dev : [];
                    return devs.includes('ms') && devs.length > 1;
                }
                return true;
            });
        
        const gamesContainer = document.querySelector('.our-games');
        gamesContainer.innerHTML = '';
        
        validGames.forEach(game => {
            const isSecret = game.id.startsWith('!secret');
            
            if (isSecret) {
                const target = parseAsMskTime(game.revealDate);
                if (isNaN(target)) return;
                const diff = target - now;
                if (diff <= 0) return;
            }
            
            const gameElement = createGameElement(game, tagsList);
            gamesContainer.appendChild(gameElement);
        });
        
    } catch (error) {
        console.error('Error loading games:', error);
    }
});

function parseAsMskTime(isoString) {
    if (typeof isoString !== 'string') return NaN;
    const clean = isoString.trim().replace('Z', '');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(clean)) return NaN;
    const parts = clean.split('T');
    if (parts.length !== 2) return NaN;
    const [datePart, timePart] = parts;
    const dateSegments = datePart.split('-').map(Number);
    const timeSegments = timePart.split(':').map(Number);
    if (dateSegments.length < 3 || timeSegments.length < 3) return NaN;
    const [year, month, day] = dateSegments;
    const [hours, minutes, seconds] = timeSegments;
    if (!year || !month || !day) return NaN;
    return Date.UTC(year, month - 1, day, hours - 3, minutes, seconds);
}

function createGameElement(game, tagsList) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game no-select';

    if (!game.visible) {
        gameDiv.style.display = 'none';
    }

    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    const backgroundPath = game.indexPage.backgroundPath;
    const isVideo = backgroundPath.endsWith('.mp4') || backgroundPath.endsWith('.webm');

    const opacity = game.indexPage.opacity ?? 1;

    if (isVideo) {
        const video = document.createElement('video');
        video.src = backgroundPath;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.className = 'background';
        video.style.opacity = opacity;
        gameContainer.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = backgroundPath;
        img.alt = '';
        img.className = 'background';
        img.style.opacity = opacity;
        gameContainer.appendChild(img);
    }

    const gameContent = document.createElement('div');
    gameContent.className = 'game-content';

    const isSecret = game.id.startsWith('!secret');

    if (isSecret) {
        const secretWrapper = document.createElement('div');
        secretWrapper.className = 'secret-game-wrapper game';

        const contentTop = document.createElement('div');
        contentTop.style.flex = '1';
        contentTop.style.display = 'flex';
        contentTop.style.flexDirection = 'column';
        contentTop.style.justifyContent = 'center';
        contentTop.style.alignItems = 'center';

        const secretTitle = document.createElement('h2');
        secretTitle.className = 'secret-title';
        secretTitle.textContent = game.name || '???';

        const timerDiv = document.createElement('div');
        timerDiv.className = 'secret-timer';
        timerDiv.id = `timer-${game.id}`;

        contentTop.appendChild(secretTitle);
        contentTop.appendChild(timerDiv);
        secretWrapper.appendChild(contentTop);

        const mskTimestamp = parseAsMskTime(game.revealDate);
        const fullDate = document.createElement('div');
        fullDate.className = 'secret-full-date';
        if (!isNaN(mskTimestamp)) {
            const mskDate = new Date(mskTimestamp);
            fullDate.textContent = mskDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else {
            fullDate.textContent = '??';
        }

        secretWrapper.appendChild(fullDate);
        gameContent.appendChild(secretWrapper);

        updateSecretTimer(game, timerDiv);
        setInterval(() => updateSecretTimer(game, timerDiv), 1000);
    } else {
        const gameInfo = document.createElement('div');
        gameInfo.className = 'game-info';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';

        const title = document.createElement('p');
        title.className = 'title';
        title.textContent = game.name;

        titleContainer.appendChild(title);

        if (game.status) {
            const note = document.createElement('p');
            note.className = 'status';
            note.textContent = game.status;
            note.style.backgroundColor = 'var(--accent-color)';
            titleContainer.appendChild(note);
        }

        gameInfo.appendChild(titleContainer);

        const rightPart = document.createElement('div');
        rightPart.className = 'right-part';

        const gamePoster = document.createElement('div');
        gamePoster.className = 'game-poster';

        if (game.poster) {
            const isPosterVideo = game.poster.endsWith('.mp4') || game.poster.endsWith('.webm');
            const posterPath = `assets/pages/games/${game.id}/${game.poster}`;

            if (isPosterVideo) {
                const posterVideo = document.createElement('video');
                posterVideo.src = posterPath;
                posterVideo.autoplay = true;
                posterVideo.loop = true;
                posterVideo.muted = true;
                posterVideo.playsInline = true;
                posterVideo.className = 'poster';
                gamePoster.appendChild(posterVideo);
            } else {
                const posterImg = document.createElement('img');
                posterImg.src = posterPath;
                posterImg.alt = '';
                posterImg.className = 'poster';
                gamePoster.appendChild(posterImg);
            }
        }

        rightPart.appendChild(gamePoster);

        const gameLink = document.createElement('a');
        gameLink.href = `game-single.html?id=${game.id}`;
        gameLink.className = 'game-link';
        gameLink.textContent = 'к игре';
        rightPart.appendChild(gameLink);

        gameContent.appendChild(gameInfo);
        gameContent.appendChild(rightPart);
    }

    gameContainer.appendChild(gameContent);
    gameDiv.appendChild(gameContainer);

    return gameDiv;
}

function updateSecretTimer(game, element) {
    const target = parseAsMskTime(game.revealDate);
    const now = Date.now();
    if (isNaN(target)) {
        element.textContent = '—';
        return;
    }
    const diff = target - now;

    const gameContainer = element.closest('.game');
    if (!gameContainer) return;

    element.classList.remove('last-10-seconds', 'last-3-seconds');

    if (diff <= 0) {
        gameContainer.classList.add('disappearing');
        setTimeout(() => gameContainer.remove(), 900);
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (diff <= 10000) {
        element.classList.add('last-10-seconds');
    }

    element.innerHTML = '';

    const timeParts = [
        { value: days, label: 'дней' },
        { value: hours, label: 'часов' },
        { value: minutes, label: 'минут' },
        { value: seconds, label: 'секунд' }
    ];

    timeParts.forEach(part => {
        const partDiv = document.createElement('div');
        partDiv.className = 'timer-part';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'timer-value';
        valueDiv.textContent = String(part.value).padStart(2, '0');

        const labelDiv = document.createElement('div');
        labelDiv.className = 'timer-label';
        labelDiv.textContent = part.label;

        partDiv.appendChild(valueDiv);
        partDiv.appendChild(labelDiv);
        element.appendChild(partDiv);
    });
}
