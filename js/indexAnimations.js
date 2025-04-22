document.addEventListener("DOMContentLoaded", () => {
    const animatedElements = document.querySelectorAll(".fade-in-up, .fade-in-left");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.classList.add("active");
                entry.target.dataset.animated = true; // Добавляем флаг
            }
        });
    }, {
        threshold: 0.3,
    });

    animatedElements.forEach((element) => {
        observer.observe(element);
    });
});