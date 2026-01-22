document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) return;

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
  const counter = document.getElementById('modal-counter');

  if (!slider || !modal || !modalImg || !modalClose || !modalSlider) return;

  let currentModalIndex = 0;
  let screenshots = [];

  const isGamePage = window.location.pathname.includes('game-single');
  const jsonPath = isGamePage ? 'json/games.json' : 'json/devs.json';
  const basePath = isGamePage 
    ? `assets/pages/games/${id}/screens/` 
    : `assets/pages/devs/${id}/screens/`;

  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Failed: ${response.status}`);

    const data = await response.json();
    const item = isGamePage ? data.projects?.[id] : data[id];

    if (!item || !Array.isArray(item.screens) || item.screens.length === 0) {
      screenshotsSection.style.display = 'none';
      return;
    }

    screenshots = item.screens.map(img => basePath + img);

    slider.innerHTML = '';
    screenshots.forEach(src => {
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.innerHTML = `<img src="${src}" alt="Скриншот игры" loading="lazy">`;
      item.addEventListener('click', () => openModal(src));
      slider.appendChild(item);
    });

    screenshotsSection.style.display = 'block';
    screenshotsSection.classList.remove('empty');

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
    window.addEventListener('resize', updateButtons);

    const openModal = (src) => {
      currentModalIndex = screenshots.indexOf(src);
      if (currentModalIndex === -1) currentModalIndex = 0;

      modalImg.src = screenshots[currentModalIndex];
      modalImg.alt = `Скриншот ${currentModalIndex + 1} из ${screenshots.length}`;
      modal.classList.remove('closing');
      modal.classList.add('opening');
      modal.style.display = 'flex';

      if (counter) counter.textContent = `${currentModalIndex + 1} / ${screenshots.length}`;

      if (modalSlider.children.length === 0) {
        screenshots.forEach((imgSrc, i) => {
          const item = document.createElement('div');
          item.className = 'modal-screenshot-item';
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
          item.setAttribute('aria-label', `Показать скриншот ${i + 1}`);
          item.innerHTML = `<img src="${imgSrc}" alt="Превью ${i + 1}" loading="lazy">`;

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (i === currentModalIndex) return;
            currentModalIndex = i;
            updateModalImage();
          });

          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (i !== currentModalIndex) {
                currentModalIndex = i;
                updateModalImage();
              }
            }
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
        modalImg.alt = `Скриншот ${currentModalIndex + 1} из ${screenshots.length}`;
        modalImg.onload = () => modalImg.style.opacity = 1;
        if (modalImg.complete) modalImg.style.opacity = 1;

        updateActiveThumbnail();
        scrollToActiveThumbnail();
        if (counter) counter.textContent = `${currentModalIndex + 1} / ${screenshots.length}`;
      }, 150);
    };

    const updateActiveThumbnail = () => {
      document.querySelectorAll('.modal-screenshot-item').forEach((item, i) => {
        item.classList.toggle('active', i === currentModalIndex);
        item.setAttribute('aria-current', i === currentModalIndex ? 'true' : 'false');
      });
    };

    const scrollToActiveThumbnail = () => {
      const items = modalSlider.querySelectorAll('.modal-screenshot-item');
      if (!items[currentModalIndex]) return;
      const activeItem = items[currentModalIndex];
      const containerWidth = modalSlider.clientWidth;
      const itemWidth = activeItem.offsetWidth;
      const itemLeft = activeItem.offsetLeft;
      const scrollLeft = itemLeft - (containerWidth - itemWidth) / 2;
      modalSlider.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    };

    const closeModal = () => {
      modal.classList.remove('opening');
      modal.classList.add('closing');
      setTimeout(() => {
        if (modal.classList.contains('closing')) {
          modal.style.display = 'none';
          modal.classList.remove('closing');
        }
      }, 300);
    };

    prevModalBtn?.addEventListener('click', () => {
      currentModalIndex = (currentModalIndex - 1 + screenshots.length) % screenshots.length;
      updateModalImage();
    });

    nextModalBtn?.addEventListener('click', () => {
      currentModalIndex = (currentModalIndex + 1) % screenshots.length;
      updateModalImage();
    });

    modalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    modalImg.addEventListener('click', (e) => e.stopPropagation());
    modalClose.addEventListener('click', (e) => e.stopPropagation());
    document.querySelectorAll('.modal-nav, .modal-screenshot-item').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (modal.style.display !== 'flex') return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        currentModalIndex = (currentModalIndex - 1 + screenshots.length) % screenshots.length;
        updateModalImage();
      } else if (e.key === 'ArrowRight') {
        currentModalIndex = (currentModalIndex + 1) % screenshots.length;
        updateModalImage();
      }
    });

    let startX = 0;

    modalImg.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    modalImg.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          currentModalIndex = (currentModalIndex + 1) % screenshots.length;
        } else {
          currentModalIndex = (currentModalIndex - 1 + screenshots.length) % screenshots.length;
        }
        updateModalImage();
      }
    }, { passive: true });

  } catch (error) {
    console.error('Error loading screenshots:', error);
    screenshotsSection.style.display = 'none';
  }
});
