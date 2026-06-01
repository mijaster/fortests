document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (!gameId) return;

  const activitiesSection = document.getElementById('activities-section');
  const activitiesContainer = document.getElementById('activities-container');
  const updateModal = document.getElementById('update-modal');
  const updateModalClose = document.getElementById('update-modal-close');
  const updateModalContent = document.getElementById('update-modal-content');

  if (!activitiesSection || !activitiesContainer || !updateModal || !updateModalClose || !updateModalContent) return;

  // --- Функция парсинга текста ---
    function parseTextFormatting(text) {
    if (!text) return '';
    
    let html = text;
    const placeholders = [];
    let placeholderIndex = 0;

    // 1. Экранирование HTML (безопасность)
    html = html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");

    // 2. Сохраняем именованные ссылки ![Текст, URL] в плейсхолдеры
    // Это защищает их от последующих замен
    html = html.replace(/!\[(.*?),\s*(https?:\/\/[^\s\]]+)\]/g, (match, linkText, url) => {
      const placeholder = `___LINK_PH_${placeholderIndex++}___`;
      // Создаем тег ссылки сразу
      placeholders.push(`<a href="${url.trim()}" target="_blank" class="update-link">${linkText.trim()}</a>`);
      return placeholder;
    });

    // 3. Автоматические ссылки (http/https)
    html = html.replace(/(https?:\/\/[^\s<"&]+)/gi, (url) => {
      return `<a href="${url}" target="_blank" class="update-link">${url}</a>`;
    });

    // 4. Автоматические ссылки (www.)
    html = html.replace(/(^|\s)(www\.[^\s<"&]+)/gi, (match, prefix, url) => {
      return `${prefix}<a href="http://${url}" target="_blank" class="update-link">${url}</a>`;
    });

    // 5. Восстанавливаем именованные ссылки
    // Теперь ссылки защищены и не будут затронуты форматированием
    placeholders.forEach((phHtml, index) => {
      html = html.replace(`___LINK_PH_${index}___`, phHtml);
    });

    // 6. Жирный текст: **текст**
    // Используем (.+?) для нежадного захвата любого символа внутри
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 7. Курсив: _текст_ или *текст*
    // Важно: обрабатываем _ после **, чтобы не ломать ссылки, если они остались
    
    // Обработка одиночных * для курсива. 
    // Внимание: это может задеть части ссылок, если они не были защищены. 
    // Но так как мы уже восстановили ссылки из плейсхолдеров, теги <a> уже есть.
    // Регекс \*([^*]+)\* может найти что-то внутри тега <a>, если там есть звездочки.
    // Чтобы избежать этого, можно использовать более сложный парсер, но для простоты:
    // Мы заменим * только если это не часть тега. 
    // Простой способ: заменить * на курсив, но исключить случаи, когда перед/после стоит < или >
    // Или просто применить, надеясь, что в ссылках редко бывают изолированные *текст*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 8. Переносы строк
    html = html.replace(/\n/g, '<br>');

    return html;
  }
  // --- Конец функции парсинга ---

  try {
    const response = await fetch('json/games.json');
    if (!response.ok) throw new Error(`Failed: ${response.status}`);

    const data = await response.json();
    const game = data.projects?.[gameId];

    if (!game || !Array.isArray(game.activities) || game.activities.length === 0) {
      activitiesSection.style.display = 'none';
      return;
    }

    const updates = game.activities;

    updates.reverse().forEach((update, index) => {
      // Determine cover image
      let coverImage = null;
      if (update.cover) {
        coverImage = `assets/pages/games/${gameId}/screens/${update.cover}`;
      } else {
        const imgBlocks = update.blocks.filter(block => block.type === 'imgs' && block.content && block.content.length > 0);
        if (imgBlocks.length > 0) {
          const randomBlock = imgBlocks[Math.floor(Math.random() * imgBlocks.length)];
          const randomImage = randomBlock.content[Math.floor(Math.random() * randomBlock.content.length)];
          coverImage = `assets/pages/games/${gameId}/screens/${randomImage}`;
        } else {
          coverImage = 'assets/images/default_cover.png';
        }
      }

      // Get preview text
      let previewText = '';
      for (const block of update.blocks) {
        if (block.type === 'text' && block.content) {
          // Убираем разметку для чистого текста превью
          const cleanText = block.content
            .replace(/!\[.*?\]/g, '') 
            .replace(/(https?:\/\/[^\s]+)/g, '') 
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/_/g, '');
          previewText = cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText;
          break;
        }
      }

      const updateCard = document.createElement('div');
      updateCard.className = `update-card ${update.isFeature ? 'featured' : ''}`;
      updateCard.innerHTML = `
        <div class="update-cover" style="background-image: url('${coverImage}')"></div>
        <div class="update-content">
          <div class="update-header">
            <h4 class="update-title">${update.title}</h4>
            <span class="update-date">${update.date}</span>
          </div>
          ${previewText ? `<p class="update-preview">${previewText}</p>` : ''}
        </div>
      `;
      
      updateCard.addEventListener('click', () => openUpdateModal(update));
      activitiesContainer.appendChild(updateCard);
    });

    activitiesSection.style.display = 'block';

    const openUpdateModal = (update) => {
      updateModalContent.innerHTML = '';

      let coverImage = null;
      if (update.cover) {
        coverImage = `assets/pages/games/${gameId}/screens/${update.cover}`;
      } else {
        const imgBlocks = update.blocks.filter(block => block.type === 'imgs' && block.content && block.content.length > 0);
        if (imgBlocks.length > 0) {
          const randomBlock = imgBlocks[Math.floor(Math.random() * imgBlocks.length)];
          const randomImage = randomBlock.content[Math.floor(Math.random() * randomBlock.content.length)];
          coverImage = `assets/pages/games/${gameId}/screens/${randomImage}`;
        } else {
          coverImage = 'assets/images/default_cover.png';
        }
      }

      const coverElement = document.createElement('div');
      coverElement.className = 'update-modal-cover';
      coverElement.style.backgroundImage = `url('${coverImage}')`;
      coverElement.innerHTML = `
        <div class="update-modal-title-overlay">
          <h2 class="update-modal-title">${update.title}</h2>
          <span class="update-modal-date">${update.date}</span>
        </div>
      `;
      updateModalContent.appendChild(coverElement);

      update.blocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = `update-block update-${block.type}`;

        switch (block.type) {
          case 'text':
            blockElement.innerHTML = `<p>${parseTextFormatting(block.content)}</p>`;
            break;
          case 'lable':
            blockElement.innerHTML = `<h4>${block.content}</h4>`;
            break;
          case 'title':
            blockElement.innerHTML = `<h2>${block.content}</h2>`;
            break;
          case 'list':
            const listHtml = block.content.map(item => `<li>${parseTextFormatting(item)}</li>`).join('');
            blockElement.innerHTML = `<ul>${listHtml}</ul>`;
            break;
          case 'imgs':
            const galleryContainer = document.createElement('div');
            galleryContainer.className = 'update-gallery';
            const sliderId = `slider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            galleryContainer.innerHTML = `
              <div class="update-gallery-slider" id="${sliderId}">
                <div class="gallery-item current-item">
                  <img src="" alt="Текущее изображение" loading="lazy">
                </div>
              </div>
              <button class="gallery-nav prev-gallery"><i class="fa-solid fa-caret-left"></i></button>
              <button class="gallery-nav next-gallery"><i class="fa-solid fa-caret-right"></i></button>
            `;
            blockElement.appendChild(galleryContainer);

            const slider = galleryContainer.querySelector('.update-gallery-slider');
            const prevBtn = galleryContainer.querySelector('.prev-gallery');
            const nextBtn = galleryContainer.querySelector('.next-gallery');
            const currentItem = slider.querySelector('.current-item img');

            const images = block.content.map(img => `assets/pages/games/${gameId}/screens/${img}`);
            let currentIndex = 0;

            const updateGallery = () => {
              slider.classList.add('animating');
              setTimeout(() => {
                currentItem.src = images[currentIndex];
                const hideGalleryNav = images.length <= 1;
                if (prevBtn) prevBtn.style.display = hideGalleryNav ? 'none' : '';
                if (nextBtn) nextBtn.style.display = hideGalleryNav ? 'none' : '';
                
                if (images.length > 1) {
                   prevBtn.disabled = false;
                   nextBtn.disabled = false;
                } else {
                   prevBtn.disabled = true;
                   nextBtn.disabled = true;
                }
                setTimeout(() => {
                  slider.classList.remove('animating');
                }, 50);
              }, 150);
            };

            updateGallery();

            if (nextBtn) {
                nextBtn.onclick = () => {
                  if (images.length > 1) {
                    currentIndex = (currentIndex + 1) % images.length;
                    updateGallery();
                  }
                };
            }

            if (prevBtn) {
                prevBtn.onclick = () => {
                  if (images.length > 1) {
                    currentIndex = (currentIndex - 1 + images.length) % images.length;
                    updateGallery();
                  }
                };
            }
            break;
        }
        updateModalContent.appendChild(blockElement);
      });

      updateModal.classList.remove('closing');
      updateModal.classList.add('opening');
      lockBodyScroll();
      updateModal.classList.add('opening');
      updateModal.style.display = 'flex';
    };

    updateModalClose.addEventListener('click', () => {
      updateModal.classList.remove('opening');
      updateModal.classList.add('closing');
      setTimeout(() => {
        updateModal.style.display = 'none';
        unlockBodyScroll();
      }, 300);
    });

    updateModal.addEventListener('click', (e) => {
      if (e.target === updateModal) {
        updateModal.classList.remove('opening');
        updateModal.classList.add('closing');
        setTimeout(() => {
          updateModal.style.display = 'none';
          unlockBodyScroll();
        }, 300);
      }
    });

    // Локальные функции блокировки прокрутки
    let _up_lockY = 0;
    function lockBodyScroll() {
      _up_lockY = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${_up_lockY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    function unlockBodyScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, _up_lockY || 0);
    }

  } catch (error) {
    console.error('Error loading updates:', error);
    activitiesSection.style.display = 'none';
  }
});