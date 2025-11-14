document.addEventListener('DOMContentLoaded', async function() {
    try {
        const [gamesResponse, tagsResponse] = await Promise.all([
            fetch('json/games.json'),
            fetch('json/tags.json')
        ]);
        
        const gamesConfig = await gamesResponse.json();
        const tagsConfig = await tagsResponse.json();
        
        const currentPage = window.location.pathname.split('/').pop();
        const urlParams = new URLSearchParams(window.location.search);
        const devId = urlParams.get('id');

        const isDevPage = currentPage === 'dev-single.html';
        const showOnlyCollabWithMs = isDevPage && devId !== 'ms';

        const validGames = Object.entries(gamesConfig)
            .filter(([id, game]) => game.indexPage?.backgroundPath)
            .map(([id, game]) => ({ id, ...game }))
            .filter(game => {
                if (showOnlyCollabWithMs) {
                    const devs = game.dev || [];
                    return devs.includes('ms') && devs.length > 1;
                }
                return true;
            });
        
        const gamesContainer = document.querySelector('.our-games');
        gamesContainer.innerHTML = '';
        
        validGames.forEach(game => {
            const gameElement = createGameElement(game, tagsConfig);
            gamesContainer.appendChild(gameElement);
        });
        
    } catch (error) {
        console.error('Error loading games:', error);
    }
});


function createGameElement(game, tagsConfig) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game';
    
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    if (!game.visible) {
        gameDiv.style.display = "none";
    }
    
    const backgroundPath = game.indexPage.backgroundPath;
    const isVideo = backgroundPath.endsWith('.mp4') || backgroundPath.endsWith('.webm');
    
    const opacity = game.indexPage.backgroundOpacity !== undefined ? 
                    game.indexPage.backgroundOpacity : 1;
    const contrast = game.indexPage.backgroundContrast !== undefined ? 
                    game.indexPage.backgroundContrast : 1;
    const brightness = game.indexPage.backgroundBrightness !== undefined ? 
                    game.indexPage.backgroundBrightness : 1;
    const blur = game.indexPage.backgroundBlur !== undefined ? 
                    game.indexPage.backgroundBlur : 0;

    const filter = `contrast(${contrast}) brightness(${brightness}) blur(${blur}px)`;

    if (isVideo) {
        const video = document.createElement('video');
        video.src = backgroundPath;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.className = 'background';
        video.style.opacity = opacity;
        video.style.filter = filter;
        gameContainer.appendChild(video);
    }
    else {
        const img = document.createElement('img');
        img.src = backgroundPath;
        img.alt = '';
        img.className = 'background';
        img.style.opacity = opacity;
        img.style.filter = filter;
        gameContainer.appendChild(img);
    }
    
    const gameContent = document.createElement('div');
    gameContent.className = 'game-content';
    
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
        note.style.backgroundColor = !game.statusColor ? "var(--accent-color)" : game.statusColor;
        titleContainer.appendChild(note);
    }
    
    gameInfo.appendChild(titleContainer);
    
    if (!game.indexPage.hideTags && game.tags && game.tags.length > 0) {
        const tagsUl = document.createElement('ul');
        tagsUl.className = 'tags';
        
        const tagsToShow = game.tags.slice(0, 4);
        
        tagsToShow.forEach(tagId => {
            if (tagsConfig[tagId]) {
                const tagLi = document.createElement('li');
                tagLi.textContent = tagsConfig[tagId].name;
                tagsUl.appendChild(tagLi);
            }
        });
        
        gameInfo.appendChild(tagsUl);
    }
    
    if (!game.indexPage.hideDescription) {
        const descriptionText = game.indexPage.description || game.description;
        const sentenceMatch = descriptionText.match(/^.*?[.!?]/);
        const firstSentence = sentenceMatch ? sentenceMatch[0] : descriptionText;
        
        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = firstSentence;
        
        gameInfo.appendChild(description);
    }
    
    gameContent.appendChild(gameInfo);
    
    const rightPart = document.createElement('div');
    rightPart.className = 'right-part';
    
    const gamePoster = document.createElement('div');
    gamePoster.className = 'game-poster';
    
    if (game.poster) {
        const isPosterVideo = game.poster.endsWith('.mp4') || game.poster.endsWith('.webm');
        
        if (isPosterVideo) {
            const posterVideo = document.createElement('video');
            posterVideo.src = 'assets/pages/games/' + game.id + '/' + game.poster;
            posterVideo.autoplay = true;
            posterVideo.loop = true;
            posterVideo.muted = true;
            posterVideo.playsInline = true;
            posterVideo.className = 'poster';
            gamePoster.appendChild(posterVideo);
        } else {
            const posterImg = document.createElement('img');
            posterImg.src = 'assets/pages/games/' + game.id + '/' + game.poster;
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
    
    gameContent.appendChild(rightPart);
    gameContainer.appendChild(gameContent);
    gameDiv.appendChild(gameContainer);
    
    return gameDiv;
}