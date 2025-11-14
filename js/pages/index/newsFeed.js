import { initNewsGallery } from './newsGallery.js';
import { openNewsModal } from './newsModal.js';
import { getAverageColor } from '../../main/getAverageColor.js';

let currentNews = null;

export function loadLatestNews() {
  fetch('json/news.json')
    .then(response => response.json())
    .then(data => {
      const latest = data.news.reduce((a, b) => {
        return new Date(b.date.split('-').reverse().join('-')) > new Date(a.date.split('-').reverse().join('-')) ? b : a;
      });

      currentNews = latest;
      const isLongText = latest.text.length > 300;

      const container = document.getElementById('last-news-container');
      container.innerHTML = createNewsHTML(latest, isLongText);

      initNewsGallery();
      setupEventListeners();

      const firstCover = latest.covers[0];
      if (firstCover) {
        getAverageColor(firstCover)
          .then(rgbString => {
            const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!match) return;

            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);

            const contentElement = container.querySelector('.last-new-content');
            if (contentElement) {
              contentElement.style.backgroundColor = rgbString;
            }
          })
          .catch(err => {
            console.warn("Не удалось получить цвет изображения:", err.message);
            const contentElement = container.querySelector('.last-new-content');
            if (contentElement) {
              contentElement.style.backgroundColor = 'var(--light-bg-color)';
            }
          });
      }
    })
    .catch(err => console.error('Ошибка загрузки новостей:', err));
}

function createNewsHTML(news, isLongText) {
  const coversHTML = news.covers.map((src, i) => `
    <img src="${src}" class="gallery-slide ${i === 0 ? 'active' : ''}" alt="${news.title}" data-index="${i}">
  `).join('');

  const dotsHTML = news.covers.map((_, i) => `
    <div class="pagination-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
  `).join('');

  return `
    <div class="news-gallery" id="newsGallery">
      <div class="gallery-slides">${coversHTML}</div>
      <div class="gallery-controls">
        <button class="gallery-btn prev-btn"><i class="fas fa-chevron-left"></i></button>
        <button class="gallery-btn next-btn"><i class="fas fa-chevron-right"></i></button>
        <div class="gallery-pagination">${dotsHTML}</div>
      </div>
    </div>
    <div class="last-new-content">
      <p class="date">${news.date}</p>
      <h3>${news.title}</h3>
      <div class="news-buttons-container">
        ${isLongText ? `
          <button class="read-more-btn">
            <span>Читать полностью</span>
            <i class="fas fa-eye"></i>
          </button>
        ` : ''}
        <div class="card-action btn" onclick="window.location.href='news.html'">
          <span>Все новости</span>
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
    </div>
  `;
}

function setupEventListeners() {
  const container = document.getElementById('last-news-container');
  const readMoreBtn = container.querySelector('.read-more-btn');

  if (readMoreBtn) {
    readMoreBtn.addEventListener('click', e => {
      e.stopPropagation();
      openNewsModal(currentNews);
    });
  }

  container.addEventListener('click', e => {
    if (!e.target.closest('.card-action, .read-more-btn, .gallery-controls')) {
      openNewsModal(currentNews);
    }
  });
}
