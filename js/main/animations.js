// js/main/animations.js
function initAnimations() {
    const elements = document.querySelectorAll('.content-card, .header-games, .latest-news-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}
