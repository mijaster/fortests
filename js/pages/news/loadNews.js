document.addEventListener('DOMContentLoaded', async () => {
  const newsContainer = document.getElementById('news-container');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalBody = document.getElementById('modal-body');
  const modalMedia = document.getElementById('modal-media');
  const modalLinks = document.getElementById('modal-links');

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
      // Галерея — имитируем слайдер (упрощённо)
      const slider = document.createElement('div');
      slider.style.display = 'flex';
      slider.style.overflow = 'hidden';
      slider.style.gap = '10px';
      slider.style.scrollSnapType = 'x mandatory';
      slider.style.scrollBehavior = 'smooth';

      article.images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Скриншот';
        img.style.minWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.cursor = 'pointer';
        img.style.borderRadius = '8px';
        img.style.scrollSnapAlign = 'start';

        // Открыть в полноэкранной галерее (если подключён loadScreenshots.js)
        img.addEventListener('click', () => {
          window.openGalleryModal?.(article.images, 0); // Предполагаем, что функция будет
        });

        slider.appendChild(img);
      });

      // Кнопки навигации (опционально)
      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = '&#10094;';
      prevBtn.style.position = 'absolute';
      prevBtn.style.left = '10px';
      prevBtn.style.top = '50%';
      prevBtn.style.transform = 'translateY(-50%)';
      prevBtn.onclick = () => slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = '&#10095;';
      nextBtn.style.position = 'absolute';
      nextBtn.style.right = '10px';
      nextBtn.style.top = '50%';
      nextBtn.style.transform = 'translateY(-50%)';
      nextBtn.onclick = () => slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      wrapper.style.borderRadius = '8px';
      wrapper.style.maxHeight = '500px';

      wrapper.appendChild(slider);
      wrapper.appendChild(prevBtn);
      wrapper.appendChild(nextBtn);

      modalMedia.appendChild(wrapper);
    }

    modal.classList.remove('hidden');
  }

  // Закрытие модального окна
  document.querySelector('.close').addEventListener('click', () => {
    modal.classList.add('hidden');
    // Остановить видео при закрытии
    const video = modalMedia.querySelector('video');
    if (video) video.pause();
  });

  function formatDate(dateStr) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('ru-RU', options);
  }
});
