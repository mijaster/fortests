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

            Object.entries(gamesConfig).forEach(([gameId, gameData]) => {
                const gameItem = document.createElement('a');
                if (!gameData.visible) {
                    gameItem.style.display = 'none';
                }
                gameItem.href = `game-single.html?id=${gameId}`;
                gameItem.className = 'game-dropdown-item';
                gameItem.innerHTML = `
                    <span class="game-name">${gameData.name} ${gameData.status}</span>
                    ${gameData.note ? `<span class="game-note">${gameData.note}</span>` : ''}
                `;
                gamesList.appendChild(gameItem);
            });

            dropdown.appendChild(gamesList);
        }

        const gamesLink = document.querySelector('.has-dropdown > a');
        const hasDropdown = document.querySelector('.has-dropdown');

        function handleDropdown() {
            const isMobile = window.innerWidth <= 992;

            if (isMobile) {
                // Mobile: клик разрешён
                gamesLink.removeEventListener('click', preventClick);
                gamesLink.addEventListener('click', handleMobileClick);
                hasDropdown.classList.remove('hover');
            } else {
                // Desktop: клик запрещён, только hover
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

        // Инициализация
        handleDropdown();
        window.addEventListener('resize', handleDropdown);
    } catch (error) {
        console.error('Error loading games config:', error);
    }
}

document.addEventListener('DOMContentLoaded', initGamesDropdown);
