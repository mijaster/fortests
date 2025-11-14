document.addEventListener("DOMContentLoaded", () => {
    const moreButtons = document.querySelectorAll(".more");

    moreButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault(); // Отменяем стандартное поведение ссылки
            const gameId = button.id; // Получаем ID игры
            window.location.href = `game.html?gameId=${gameId}`; // Переходим на game.html с параметром
        });
    });
});