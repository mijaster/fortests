// js/main/components_loader.js

/**
 * Загружает HTML-фрагмент по URL и вставляет в контейнер
 * @param {string} url - путь к HTML-файлу
 * @param {string} containerId - ID контейнера
 * @param {Function} callback - опциональный колбэк после загрузки
 */
function loadComponent(url, containerId, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Ошибка загрузки ${url}: ${response.status}`);
      return response.text();
    })
    .then(html => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        if (callback) callback();
      }
    })
    .catch(err => console.error(err));
}

/**
 * Загружает компонент в указанный селектор (например, body)
 * @param {string} url - путь к HTML-файлу
 * @param {string} selector - CSS-селектор, куда вставлять (например, 'body')
 * @param {Function} callback - опциональный колбэк
 */
function loadComponentToSelector(url, selector, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Ошибка загрузки ${url}: ${response.status}`);
      return response.text();
    })
    .then(html => {
      const target = document.querySelector(selector);
      if (target) {
        target.insertAdjacentHTML('beforeend', html);
        if (callback) callback();
      }
    })
    .catch(err => console.error(err));
}

/**
 * Основная функция загрузки компонентов
 */
function loadComponents() {
  // Загружаем стандартные компоненты
  loadComponent('header.html', 'header-container', () => {
    if (typeof initBurgerMenu === 'function') initBurgerMenu();
    if (typeof initGamesDropdown === 'function') initGamesDropdown();
  });

  loadComponent('footer.html', 'footer-container');
  loadComponent('preloader.html', 'preloader-container');

  // Загружаем видеоплеер, если на странице есть его контейнер
  if (document.getElementById('video-player-container')) {
    loadComponentToSelector('video-player.html', 'body', () => {
      console.log('Видеоплеер загружен');
    });
  }
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', loadComponents);
