document.addEventListener('DOMContentLoaded', function() {
    fetch('json/index_banner.json')
        .then(response => response.json())
        .then(config => {
            const bannerContainer = document.querySelector('.banner-container');
            const bannerWrapper = document.querySelector('.banner-wrapper');
            const overlay = document.querySelector('.banner-container .overlay');
            const bannerLogo = document.querySelector('.banner-logo');

            // Проверка на существование элементов
            if (!bannerWrapper || !bannerContainer) {
                console.warn('Banner elements not found');
                return;
            }

            // Установка прозрачности
            const opacity = parseFloat(config.opacity);
            if (!isNaN(opacity)) {
                bannerWrapper.style.opacity = opacity;
            }

            if (config.file) {
                const isVideo = /\.(mp4|webm|mov)$/i.test(config.file);
                
                if (isVideo) {
                    bannerWrapper.innerHTML = `
                        <video 
                            class="banner" 
                            autoplay 
                            muted 
                            loop 
                            playsinline 
                            disablePictureInPicture
                            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                        >
                            <source src="assets/pages/index/banner/${config.file}" type="video/${config.file.split('.').pop().toLowerCase()}">
                        </video>
                    `;
                    
                    const video = bannerWrapper.querySelector('video');
                    if (video) {
                        video.style.maskImage = 'none';
                        video.style.webkitMaskImage = 'none';
                    }

                    // Анимация масштабирования
                    bannerWrapper.style.transform = 'scale(1.1) translateY(15px)';
                    
                    // Сброс трансформации при наведении — через CSS предпочтительнее, но можно и так:
                    bannerWrapper.addEventListener('mouseenter', () => {
                        bannerWrapper.style.transform = 'scale(1) translateY(0)';
                    });
                    bannerWrapper.addEventListener('mouseleave', () => {
                        bannerWrapper.style.transform = 'scale(1.1) translateY(15px)';
                    });

                    // Коррекция отступа для контента
                    const contentSection = document.querySelector('.content-section');
                    if (contentSection) {
                        contentSection.style.paddingTop = '50px';
                    }
                } else {
                    bannerWrapper.innerHTML = `<img src="assets/pages/index/banner/${config.file}" alt="banner" class="banner">`;
                }
            }

            // Создание текстового блока
            const textContainer = document.createElement('div');
            textContainer.className = 'banner-text-container';

            if (config.title) {
                let titleElement;

                if (config.titleLink) {
                    titleElement = document.createElement('a');
                    titleElement.href = config.titleLink;
                    titleElement.className = 'banner-title-link';
                    
                    titleElement.addEventListener('mouseenter', () => {
                        bannerWrapper.style.opacity = Math.max(0, (opacity - 0.4).toFixed(2));
                    });
                    titleElement.addEventListener('mouseleave', () => {
                        bannerWrapper.style.opacity = opacity;
                    });
                } else {
                    titleElement = document.createElement('div');
                }

                titleElement.className = 'banner-title';
                titleElement.textContent = config.title;

                if (config.subtitle) {
                    titleElement.style.borderBottom = '1px solid #fff';
                    titleElement.style.paddingBottom = '10px';
                }
                textContainer.appendChild(titleElement);
            }

            if (config.subtitle) {
                const subtitleElement = document.createElement('div');
                subtitleElement.className = 'banner-subtitle';
                subtitleElement.textContent = config.subtitle;
                textContainer.appendChild(subtitleElement);
            }

            // Скрытие стандартного оверлея и логотипа
            if (config.hideDefaultOverlay) {
                if (overlay) overlay.style.display = 'none';
                if (bannerLogo) bannerLogo.style.display = 'none';
                bannerContainer.appendChild(textContainer);
            }
        })
        .catch(error => {
            console.error('Error loading banner config:', error);
        });
});
