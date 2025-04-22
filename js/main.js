window.addEventListener("load", () => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
        preloader.classList.add("loaded");

        setTimeout(() => {
            preloader.style.display = "none";
        }, 500);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Intersection Observer для анимаций
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                }
            });
        },
        {
            threshold: 0.2,
        }
    );

    const animatedElements = document.querySelectorAll(".fade-in-left, .fade-in-right, .fade-in-up");
    animatedElements.forEach((element) => {
        observer.observe(element);
    });

    // Загрузка компонентов
    function loadHeader() {
        fetch('header.html')
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка загрузки header.html: ${response.status}`);
                return response.text();
            })
            .then(data => {
                const headerContainer = document.getElementById('header-container');
                if (headerContainer) headerContainer.innerHTML = data;

                // Инициализация меню-бургера после загрузки хедера
                initBurgerMenu();
            })
            .catch(error => console.error(error));
    }

    function loadFooter() {
        fetch('footer.html')
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка загрузки footer.html: ${response.status}`);
                return response.text();
            })
            .then(data => {
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) footerContainer.innerHTML = data;
            })
            .catch(error => console.error(error));
    }

    function loadPreloader() {
        fetch('preloader.html')
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка загрузки preloader.html: ${response.status}`);
                return response.text();
            })
            .then(data => {
                const preloaderContainer = document.getElementById('preloader-container');
                if (preloaderContainer) preloaderContainer.innerHTML = data;
            })
            .catch(error => console.error(error));
    }

    // Загружаем компоненты
    loadHeader();
    loadFooter();
    loadPreloader();

    // Инициализация бургер-меню (новая версия)
    function initBurgerMenu() {
        const burgerMenu = document.querySelector('.burger-menu');
        const navMenu = document.querySelector('.nav-menu');
        const burgerIcon = document.querySelector('.burger-icon');
        const navLinks = document.querySelectorAll('.nav-links a');

        if (burgerMenu && navMenu) {
            // Обработчик клика по бургер-иконке
            burgerMenu.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                burgerIcon.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });

            // Закрытие меню при клике на ссылку
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    burgerIcon.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                });
            });

            // Закрытие меню при клике вне области
            document.addEventListener('click', (event) => {
                const isClickInside = navMenu.contains(event.target) || burgerMenu.contains(event.target);
                
                if (!isClickInside && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    burgerIcon.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                }
            });

            // Закрытие меню при нажатии Escape
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    burgerIcon.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                }
            });
        }
    }
});