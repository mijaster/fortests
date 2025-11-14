// js/main/main.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initHeaderScroll === 'function') initHeaderScroll();
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof loadComponents === 'function') loadComponents();
});

// Прелоадер инициализируется отдельно (ждёт полной загрузки)
if (typeof initPreloader === 'function') initPreloader();
