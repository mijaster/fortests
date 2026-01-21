async function initGamesDropdown() {
    try {
        const response = await fetch('json/games.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const gamesConfig = await response.json();
        const dropdown = document.querySelector('.games-dropdown');

        if (dropdown) {
            dropdown.innerHTML = '';
            const gamesList = document.createElement('div');
            gamesList.className = 'games-dropdown-list';

            const now = Date.now();

            for (const [gameId, gameData] of Object.entries(gamesConfig.projects)) {
                if (!gameData.visible || gameId.startsWith('_secret')) continue;

                const revealTimestamp = parseAsMskTime(gameData.revealDate);
                if (!isNaN(revealTimestamp) && revealTimestamp > now) continue;

                const gameItem = document.createElement('a');
                gameItem.href = `game-single.html?id=${gameId}`;
                gameItem.className = 'game-dropdown-item';

                let nameText = gameData.name;
                if (gameData.status) {
                    nameText += " " + gameData.status;
                }

                let content = `<span class="game-name">${nameText}</span>`;

                gameItem.innerHTML = content;
                gamesList.appendChild(gameItem);
            }

            dropdown.appendChild(gamesList);
        }

        const gamesLink = document.querySelector('.has-dropdown > a');
        const hasDropdown = document.querySelector('.has-dropdown');

        if (!gamesLink || !hasDropdown) return;

        function handleDropdown() {
            const isMobile = window.innerWidth <= 992;

            if (isMobile) {
                gamesLink.removeEventListener('click', preventClick);
                gamesLink.addEventListener('click', handleMobileClick);
                hasDropdown.classList.remove('hover');
            } else {
                gamesLink.removeEventListener('click', handleMobileClick);
                gamesLink.addEventListener('click', preventClick);
                setupHoverEffect();
            }
        }

        function preventClick(e) {
            e.preventDefault();
        }

        function handleMobileClick(e) {
            e.preventDefault();
            hasDropdown.classList.toggle('active');
        }

        function setupHoverEffect() {
            hasDropdown.addEventListener('mouseenter', () => {
                hasDropdown.classList.add('hover');
            });
            hasDropdown.addEventListener('mouseleave', () => {
                hasDropdown.classList.remove('hover');
            });
        }

        handleDropdown();
        window.addEventListener('resize', handleDropdown);
    } catch (error) {
        console.error('Error loading games config:', error);
    }
}

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

document.addEventListener('DOMContentLoaded', initGamesDropdown);