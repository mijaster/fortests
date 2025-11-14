// js/main/preloader.js
function initPreloader() {
    window.addEventListener('load', () => {
        const preloader = document.querySelector('#preloader-container') || document.querySelector('.preloader');
        if (preloader) {
            preloader.classList.add('loaded');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    });
}
