// js/main/burger_menu.js
function initBurgerMenu() {
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const burgerIcon = document.querySelector('.burger-icon');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            burgerIcon.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                burgerIcon.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });

        document.addEventListener('click', (event) => {
            const isClickInside = navMenu.contains(event.target) || burgerMenu.contains(event.target);
            if (!isClickInside && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                burgerIcon.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                burgerIcon.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    }
}
