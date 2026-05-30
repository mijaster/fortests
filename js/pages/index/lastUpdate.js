export function loadLastUpdate() {
  fetch('json/games.json')
    .then(response => response.json())
    .then(data => {
      const latest = findLatestUpdate(data.projects || {});
      if (!latest) {
        console.warn('Последнее обновление не найдено в games.json');
        return;
      }

      const container = document.getElementById('last-update-container');
      if (!container) return;
      container.innerHTML = createLastUpdateHTML(latest);
      
      // Apply average color to the card
      const coverPath = getUpdateCoverPath(latest.gameId, latest.update);
      applyAverageColorToCard(latest.gameId, coverPath);
    })
    .catch(error => console.error('Ошибка загрузки последнего обновления:', error));
}

function findLatestUpdate(projects) {
  let latest = null;

  Object.entries(projects).forEach(([gameId, game]) => {
    if (!Array.isArray(game.activities)) return;

    game.activities.forEach(update => {
      const updateDate = parseUpdateDate(update.date);
      if (isNaN(updateDate)) return;

      if (!latest || updateDate > latest.date) {
        latest = {
          gameId,
          gameName: game.name || '',
          update,
          date: updateDate,
        };
      }
    });
  });

  return latest;
}

function parseUpdateDate(dateValue) {
  if (typeof dateValue !== 'string') return NaN;
  const normalized = dateValue.trim();

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const dotMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    return Date.UTC(Number(dotMatch[3]), Number(dotMatch[2]) - 1, Number(dotMatch[1]));
  }

  return NaN;
}

function getUpdateCoverPath(gameId, update) {
  if (update.cover) {
    return `assets/pages/games/${gameId}/screens/${update.cover}`;
  }

  const imgsBlock = Array.isArray(update.blocks)
    ? update.blocks.find(block => block.type === 'imgs' && Array.isArray(block.content) && block.content.length > 0)
    : null;

  if (imgsBlock) {
    return `assets/pages/games/${gameId}/screens/${imgsBlock.content[0]}`;
  }

  return 'assets/images/default_cover.png';
}

function getUpdatePreview(update) {
  if (!Array.isArray(update.blocks)) return '';

  const textBlock = update.blocks.find(block => block.type === 'text' && block.content);
  if (textBlock && typeof textBlock.content === 'string') {
    return truncateText(textBlock.content, 180);
  }

  const titleBlock = update.blocks.find(block => block.type === 'title' && block.content);
  if (titleBlock && typeof titleBlock.content === 'string') {
    return titleBlock.content;
  }

  const listBlock = update.blocks.find(block => block.type === 'list' && Array.isArray(block.content) && block.content.length > 0);
  if (listBlock) {
    return listBlock.content.slice(0, 2).join(', ');
  }

  return update.title || '';
}

function truncateText(text, maxLength) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).replace(/\s+$/, '')}...`;
}

function createLastUpdateHTML(latest) {
  const coverPath = getUpdateCoverPath(latest.gameId, latest.update);
  const preview = getUpdatePreview(latest.update) || 'Описание обновления пока недоступно.';

  return `
    <a href="game-single.html?id=${latest.gameId}" class="last-update-link">
      <div class="last-update-wrapper" id="update-card-${latest.gameId}">
        <div class="update-badge">последнее</div>
        <div class="update-cover">
          <img src="${coverPath}" alt="${latest.update.title}" id="update-cover-${latest.gameId}">
        </div>
        <div class="update-info">
          <div class="update-meta">
            <span class="update-game-name">${latest.gameName}</span>
          </div>
          <h3 class="update-title">${latest.update.title}</h3>
          <div class="update-date">${latest.update.date}</div>
          <p class="update-text">${preview}</p>
          <div class="update-actions">
            <a class="btn" href="game-single.html?id=${latest.gameId}">
              <span>К игре</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </a>
  `;
}

// After the lastUpdate.js file, add the function to apply average color
function applyAverageColorToCard(gameId, coverPath) {
  // Create an offscreen image to calculate average color
  const img = new Image();
  img.crossOrigin = 'Anonymous'; // Handle CORS if image is from external domain
  img.src = coverPath;

  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Optimization: Resize to a smaller size for faster processing 
    // since we only need the average color, not pixel-perfect detail
    const scaleSize = 50; 
    canvas.width = scaleSize;
    canvas.height = scaleSize;
    
    ctx.drawImage(img, 0, 0, scaleSize, scaleSize);
    
    // Get image data and calculate average color
    const imageData = ctx.getImageData(0, 0, scaleSize, scaleSize);
    const data = imageData.data;
    
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    // Iterate through all pixels of the small canvas
    for (let i = 0; i < data.length; i += 4) {
      // Optional: Skip fully transparent pixels if the source image has transparency
      if (data[i + 3] < 128) continue; 

      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    
    // Calculate average raw color
    if (count > 0) {
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
    }

    // --- MIXING LOGIC START ---
    // Target overlay: rgba(15, 15, 15, 0.85)
    const overlayR = 15;
    const overlayG = 15;
    const overlayB = 15;
    const alpha = 0.95;

    // Formula: Result = Source * (1 - alpha) + Overlay * alpha
    const finalR = Math.round(r * (1 - alpha) + overlayR * alpha);
    const finalG = Math.round(g * (1 - alpha) + overlayG * alpha);
    const finalB = Math.round(b * (1 - alpha) + overlayB * alpha);
    // --- MIXING LOGIC END ---
    
    // Apply the calculated mixed color to the card
    const card = document.getElementById(`update-card-${gameId}`);
    if (card) {
      // Use the mixed color
      card.style.backgroundColor = `rgb(${finalR}, ${finalG}, ${finalB})`;
      
      // Adjust for contrast by setting text colors appropriately
      const updateInfo = card.querySelector('.update-info');
      if (updateInfo) {
        // Determine if the background is light or dark to adjust text color
        // Using standard luminance formula
        const brightness = (finalR * 299 + finalG * 587 + finalB * 114) / 1000;
        
        if (brightness > 128) {
          // Dark text for light backgrounds
          updateInfo.style.color = '#1a1a1a'; // Slightly softer black
          updateInfo.style.textShadow = 'none';
        } else {
          // Light text for dark backgrounds
          updateInfo.style.color = '#ffffff';
          // Optional: Add slight shadow for better readability on complex backgrounds
          updateInfo.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
        }
      }
    }
  };
  
  img.onerror = function() {
    console.warn(`Could not load image: ${coverPath}`);
    // Fallback style if image fails
    const card = document.getElementById(`update-card-${gameId}`);
    if (card) {
       // Apply just the overlay color as fallback
       card.style.backgroundColor = 'rgba(15, 15, 15, 0.95)';
    }
  };
}