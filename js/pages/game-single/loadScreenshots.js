document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (!gameId) {
    console.warn('[Screenshots] ID игры не указан в URL');
    return;
  }

  const slider = document.getElementById('screenshots-slider');
  const prevBtn = document.getElementById('prev-screenshot');
  const nextBtn = document.getElementById('next-screenshot');
  const modal = document.getElementById('screenshot-modal');
  const modalImg = document.getElementById('modal-img');
  const modalClose = document.getElementById('modal-close');
  const modalSlider = document.getElementById('modal-screenshots-slider');
  const prevModalBtn = document.getElementById('prev-modal');
  const nextModalBtn = document.getElementById('next-modal');
  const screenshotsSection = document.getElementById('screenshots-section');

  if (!slider || !modal || !modalImg || !modalClose || !modalSlider) {
    console.warn(`[Screenshots] Не все DOM-элементы найдены для игры: ${gameId}`);
    return;
  }

  let currentModalIndex = 0;
  let screenshots = [];

  try {
    const response = await fetch('json/games.json');
    if (!response.ok) {
      throw new Error(`Не удалось загрузить games.json: ${response.status}`);
    }

    const games = await response.json();
    const game = games[gameId];

    if (!game) {
      console.warn(`[Screenshots] Игра с ID "${gameId}" не найдена в games.json`);
      return;
    }

    if (!game.visible) {
      console.log(`[Screenshots] Игра "${gameId}" скрыта (visible: false)`);
      return;
    }

    if (!Array.isArray(game.screenshots) || game.screenshots.length === 0) {
      console.log(`[Screenshots] У игры "${gameId}" нет скриншотов`);
      return;
    }

    screenshots = game.screenshots.map(img =>
      `assets/pages/games/${gameId}/screens/${img}`
    );

    slider.innerHTML = '';
    screenshots.forEach(src => {
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.innerHTML = `<img src="${src}" alt="Скриншот" loading="lazy">`;
      item.addEventListener('click', () => openModal(src));
      slider.appendChild(item);
    });

    if (screenshotsSection) {
      screenshotsSection.style.display = 'block';
      screenshotsSection.classList.remove('empty');
    }

    const scrollAmount = 380;

    const updateButtons = () => {
      if (prevBtn) prevBtn.disabled = slider.scrollLeft === 0;
      if (nextBtn) nextBtn.disabled = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10;
    };

    nextBtn?.addEventListener('click', () => {
      slider.scrollTo({ left: slider.scrollLeft + scrollAmount, behavior: 'smooth' });
    });

    prevBtn?.addEventListener('click', () => {
      slider.scrollTo({ left: slider.scrollLeft - scrollAmount, behavior: 'smooth' });
    });

    slider.addEventListener('scroll', updateButtons);
    updateButtons();

    const openModal = (src) => {
      currentModalIndex = screenshots.indexOf(src);
      if (currentModalIndex === -1) currentModalIndex = 0;

      modalImg.src = screenshots[currentModalIndex];
      modal.style.display = 'flex';

      if (modalSlider.children.length === 0) {
        screenshots.forEach((imgSrc, i) => {
          const item = document.createElement('div');
          item.className = 'modal-screenshot-item';
          item.innerHTML = `<img src="${imgSrc}" alt="Скриншот">`;
          item.addEventListener('click', () => {
            currentModalIndex = i;
            updateModalImage();
            scrollToActiveThumbnail();
          });
          modalSlider.appendChild(item);
        });
      }

      updateActiveThumbnail();
      scrollToActiveThumbnail();
    };

    const updateModalImage = () => {
      modalImg.style.opacity = 0;

      setTimeout(() => {
        modalImg.src = screenshots[currentModalIndex];
        modalImg.onload = () => {
          modalImg.style.opacity = 1;
        };
        if (modalImg.complete) {
          modalImg.style.opacity = 1;
        }
        updateActiveThumbnail();
        scrollToActiveThumbnail();
      }, 150);
    };

    const updateActiveThumbnail = () => {
      document.querySelectorAll('.modal-screenshot-item').forEach((item, i) => {
        item.classList.toggle('active', i === currentModalIndex);
      });
    };

    const scrollToActiveThumbnail = () => {
      const items = modalSlider.querySelectorAll('.modal-screenshot-item');
      if (items.length === 0 || !items[currentModalIndex]) return;

      const activeItem = items[currentModalIndex];
      const containerWidth = modalSlider.clientWidth;
      const itemWidth = activeItem.offsetWidth;
      const itemLeft = activeItem.offsetLeft;

      const scrollLeft = itemLeft - (containerWidth - itemWidth) / 2;

      modalSlider.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    };

    prevModalBtn?.addEventListener('click', () => {
      currentModalIndex = (currentModalIndex - 1 + screenshots.length) % screenshots.length;
      updateModalImage();
    });

    nextModalBtn?.addEventListener('click', () => {
      currentModalIndex = (currentModalIndex + 1) % screenshots.length;
      updateModalImage();
    });

    modalClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (modal.style.display !== 'flex') return;

      if (e.key === 'Escape') {
        modal.style.display = 'none';
      } else if (e.key === 'ArrowLeft') {
        currentModalIndex = (currentModalIndex - 1 + screenshots.length) % screenshots.length;
        updateModalImage();
      } else if (e.key === 'ArrowRight') {
        currentModalIndex = (currentModalIndex + 1) % screenshots.length;
        updateModalImage();
      }
    });

  } catch (error) {
    console.error(`[Screenshots] Ошибка при загрузке скриншотов для игры "${gameId}":`, error);
  }
});
