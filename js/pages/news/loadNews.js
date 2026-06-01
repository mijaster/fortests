document.addEventListener('DOMContentLoaded', async () => {
  const newsContainer = document.getElementById('news-container');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalBody = document.getElementById('modal-body');
  const modalMedia = document.getElementById('modal-media');
  const modalLinks = document.getElementById('modal-links');

  let touchStartX = 0;
  let touchEndX = 0;
  let currentSlider = null;

  try {
    const response = await fetch('json/news.json');
    const news = await response.json();

    news.forEach(article => {
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `
        <img src="${article.image}" alt="${article.title}">
        <div class="card-body">
          <h3>${article.title}</h3>
          <p>${article.preview}</p>
          <p class="date">${formatDate(article.date)}</p>
        </div>
      `;
      card.addEventListener('click', () => openModal(article));
      newsContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Ошибка загрузки новостей:', error);
  }

  function openModal(article) {
    modalTitle.textContent = article.title;
    modalDate.textContent = formatDate(article.date);
    modalBody.innerHTML = article.content;

    // Очистка предыдущего медиа
    modalMedia.innerHTML = '';
    modalLinks.innerHTML = '';

    // Обработка ссылок
    if (Array.isArray(article.links)) {
      article.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.text;
        modalLinks.appendChild(a);
      });
    }

    // Проверка: видео или галерея?
    if (article.video) {
      // Локальное видео
      const video = document.createElement('video');
      video.src = article.video;
      video.controls = true;
      video.style.width = '100%';
      video.style.borderRadius = '8px';
      modalMedia.appendChild(video);

      // Автовоспроизведение (опционально)
      video.onloadeddata = () => video.play().catch(e => console.warn("Autoplay blocked:", e));
    } else if (Array.isArray(article.images) && article.images.length > 0) {
      // Галерея — полноширинный слайдер с поддержкой свайпа
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-wrapper';

      const slider = document.createElement('div');
      slider.className = 'gallery-slider';
      currentSlider = slider;

      let imageIndex = 0;

      article.images.forEach((src, index) => {
        const slide = document.createElement('div');
        slide.className = 'gallery-slide';
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Скриншот ${index + 1}`;
        
        slide.appendChild(img);
        slider.appendChild(slide);
      });

      // Кнопки навигации
      const prevBtn = document.createElement('button');
      prevBtn.className = 'gallery-nav-button prev';
      prevBtn.innerHTML = '&#10094;';
      prevBtn.setAttribute('aria-label', 'Предыдущее изображение');
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        scrollGallery(-1, slider);
      };

      const nextBtn = document.createElement('button');
      nextBtn.className = 'gallery-nav-button next';
      nextBtn.innerHTML = '&#10095;';
      nextBtn.setAttribute('aria-label', 'Следующее изображение');
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        scrollGallery(1, slider);
      };

      // Счётчик изображений
      const counter = document.createElement('div');
      counter.className = 'gallery-counter';
      updateCounter(counter, 1, article.images.length);

      // Отслеживание текущего изображения при скролле
      slider.addEventListener('scroll', () => {
        const scrollLeft = slider.scrollLeft;
        const slideWidth = slider.offsetWidth;
        imageIndex = Math.round(scrollLeft / slideWidth);
        updateCounter(counter, imageIndex + 1, article.images.length);
      });

      // Touch-события для свайпа
      slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);

      slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(slider);
      }, false);

      // Предотвращение прокрутки страницы при скролле галереи
      slider.addEventListener('touchmove', (e) => {
        if (slider.scrollWidth > slider.clientWidth) {
          e.stopPropagation();
        }
      }, false);

      wrapper.appendChild(slider);
      wrapper.appendChild(prevBtn);
      wrapper.appendChild(nextBtn);
      modalMedia.appendChild(wrapper);
      modalMedia.appendChild(counter);

      // Скрыть кнопки навигации на очень узких экранах если есть поддержка touch
      if (window.matchMedia('(max-width: 480px) and (hover: none)').matches) {
        prevBtn.style.opacity = '0.6';
        nextBtn.style.opacity = '0.6';
      }
    }

    lockBodyScroll();
    modal.classList.remove('hidden');
  }

  function scrollGallery(direction, slider) {
    const slideWidth = slider.offsetWidth;
    slider.scrollBy({
      left: direction * slideWidth,
      behavior: 'smooth'
    });
  }

  function handleSwipe(slider) {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Свайп влево — следующее изображение
        scrollGallery(1, slider);
      } else {
        // Свайп вправо — предыдущее изображение
        scrollGallery(-1, slider);
      }
    }
  }

  function updateCounter(counterElement, current, total) {
    counterElement.textContent = `${current} / ${total}`;
  }

  // Закрытие модального окна
  document.querySelector('.close').addEventListener('click', () => {
    modal.classList.add('hidden');
    unlockBodyScroll();
    // Остановить видео при закрытии
    const video = modalMedia.querySelector('video');
    if (video) video.pause();
  });

  // Блокировка прокрутки тела страницы при открытом модальном окне
  let _scrollLockY = 0;
  function lockBodyScroll() {
    _scrollLockY = window.scrollY || window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollLockY}px`;
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
    window.scrollTo(0, _scrollLockY || 0);
  }

  function formatDate(dateStr) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('ru-RU', options);
  }
});
