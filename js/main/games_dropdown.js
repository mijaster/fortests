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
            const gamesLink = document.querySelector('.has-dropdown > a');

            if (gamesLink) {
                gamesLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                });

                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !gamesLink.contains(e.target)) {
                        dropdown.classList.remove('active');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading games config:', error);
    }
}
