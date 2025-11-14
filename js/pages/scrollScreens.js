class ImageSlider {
    constructor() {
        this.slides = document.querySelectorAll('.screen');
        this.indicators = document.querySelectorAll('.indicator');
        this.currentIndex = 0;
        this.animationDuration = 800; // Должно совпадать с CSS
        
        this.init();
    }
    
    init() {
        // Показываем первый слайд
        this.slides[0].classList.add('active');
        
        // Назначаем обработчики для стрелок
        document.querySelector('.left-arrow').addEventListener('click', () => this.prev());
        document.querySelector('.right-arrow').addEventListener('click', () => this.next());
        
        // Назначаем обработчики для индикаторов
        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                this.goTo(index);
            });
        });
        
        // Автопереключение
        this.startAutoSlide();
        
        // Пауза при наведении
        document.querySelector('.screens-container').addEventListener('mouseenter', () => {
            this.stopAutoSlide();
        });
        
        document.querySelector('.screens-container').addEventListener('mouseleave', () => {
            this.startAutoSlide();
        });
    }
    
    goTo(index) {
        if (index === this.currentIndex) return;
        
        const currentSlide = this.slides[this.currentIndex];
        const nextSlide = this.slides[index];
        
        // Начинаем анимацию
        currentSlide.classList.remove('active');
        nextSlide.classList.add('active');
        
        // Обновляем текущий индекс
        this.currentIndex = index;
        
        // Обновляем индикаторы
        this.updateIndicators();
    }
    
    updateIndicators() {
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === this.currentIndex);
        });
    }
    
    next() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goTo(nextIndex);
    }
    
    prev() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goTo(prevIndex);
    }
    
    startAutoSlide() {
        this.stopAutoSlide();
        this.autoSlideInterval = setInterval(() => this.next(), 5000);
    }
    
    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
    }
}

// Инициализация слайдера
document.addEventListener('DOMContentLoaded', () => {
    new ImageSlider();
});