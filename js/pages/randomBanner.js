document.addEventListener('DOMContentLoaded', function() {
    // Количество баннеров в папке (нужно указать вручную или получить через серверный скрипт)
    const bannerCount = 3; // Замените на реальное количество изображений
    
    // Генерируем случайное число от 1 до bannerCount
    const randomBannerNumber = Math.floor(Math.random() * bannerCount) + 1;
    
    // Формируем путь к изображению
    const bannerPath = `imgs/banners/${randomBannerNumber}.png`; // Измените расширение если нужно
    
    // Находим элемент с классом banner и устанавливаем src
    const bannerElement = document.querySelector('img.banner');
    if (bannerElement) {
        bannerElement.src = bannerPath;
        // Можно добавить alt для доступности
        bannerElement.alt = `Promotional Banner ${randomBannerNumber}`;
    }
});