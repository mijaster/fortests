let modalImageIndex = 0;
let modalGalleryInterval = null;

export function openNewsModal(news) {
    if (!news) return;

    const modal = document.getElementById('newsModal');
    const banner = document.getElementById('modalBanner');
    const date = document.getElementById('modalDate');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');
    const pagination = document.getElementById('modalPagination');

    banner.src = news.covers[0];
    date.textContent = news.date;
    title.textContent = news.title;
    text.innerHTML = news.text;

    pagination.innerHTML = '';
    news.covers.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `modal-pagination-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => setModalImage(i, news));
        pagination.appendChild(dot);
    });

    modalImageIndex = 0;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    setTimeout(() => modal.classList.add('show'), 10);

    startModalRotation();
    setupModalCloseHandlers();
}

export function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        stopModalRotation();
    }, 300);
}

function setModalImage(index, news) {
    if (index === modalImageIndex) return;

    const banner = document.getElementById('modalBanner');
    const dots = document.querySelectorAll('.modal-pagination-dot');

    banner.style.opacity = '0';

    setTimeout(() => {
        banner.src = news.covers[index];
        banner.style.opacity = '1';

        dots[modalImageIndex]?.classList.remove('active');
        dots[index]?.classList.add('active');

        modalImageIndex = index;

        stopModalRotation();
        startModalRotation();
    }, 300);
}

function showNextModalImage(news) {
    const next = (modalImageIndex + 1) % news.covers.length;
    setModalImage(next, news);
}

function showPrevModalImage(news) {
    const prev = (modalImageIndex - 1 + news.covers.length) % news.covers.length;
    setModalImage(prev, news);
}

function startModalRotation() {
    stopModalRotation();
    modalGalleryInterval = setInterval(() => {
        const news = window.currentNews || JSON.parse(sessionStorage.getItem('currentModalNews'));
        if (news) showNextModalImage(news);
    }, 7000);
}

function stopModalRotation() {
    if (modalGalleryInterval) {
        clearInterval(modalGalleryInterval);
        modalGalleryInterval = null;
    }
}

function setupModalCloseHandlers() {
    const modal = document.getElementById('newsModal');

    modal.addEventListener('click', e => {
        if (e.target === modal) closeNewsModal();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeNewsModal();
        }
    }, { once: false });
}
