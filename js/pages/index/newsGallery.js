let currentImageIndex = 0;
let galleryInterval = null;

export function initNewsGallery() {
    const gallery = document.getElementById('newsGallery');
    if (!gallery) return;

    const prevBtn = gallery.querySelector('.prev-btn');
    const nextBtn = gallery.querySelector('.next-btn');
    const dots = gallery.querySelectorAll('.pagination-dot');

    prevBtn.addEventListener('click', e => {
        e.stopPropagation();
        showPrevImage();
    });

    nextBtn.addEventListener('click', e => {
        e.stopPropagation();
        showNextImage();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', e => {
            e.stopPropagation();
            setImageIndex(i);
        });
    });

    startRotation();
    gallery.addEventListener('mouseenter', stopRotation);
    gallery.addEventListener('mouseleave', startRotation);
}

function showNextImage() {
    const slides = document.querySelectorAll('.gallery-slide');
    const next = (currentImageIndex + 1) % slides.length;
    setImageIndex(next);
}

function showPrevImage() {
    const slides = document.querySelectorAll('.gallery-slide');
    const prev = (currentImageIndex - 1 + slides.length) % slides.length;
    setImageIndex(prev);
}

function setImageIndex(index) {
    const slides = document.querySelectorAll('.gallery-slide');
    const dots = document.querySelectorAll('.pagination-dot');

    if (index === currentImageIndex) return;

    slides[currentImageIndex]?.classList.remove('active');
    dots[currentImageIndex]?.classList.remove('active');

    slides[index].classList.add('active');
    dots[index].classList.add('active');

    currentImageIndex = index;

    stopRotation();
    startRotation();
}

function startRotation() {
    stopRotation();
    galleryInterval = setInterval(showNextImage, 7000);
}

function stopRotation() {
    if (galleryInterval) {
        clearInterval(galleryInterval);
        galleryInterval = null;
    }
}
