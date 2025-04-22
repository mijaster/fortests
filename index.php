<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Главная - MIJASTER</title>
    <link rel="stylesheet" href="css/index.css">
    <link rel="stylesheet" href="css/preloader.css">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/animations.css">
    <link rel="icon" href="imgs/logo_icon.svg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="js/main.js" defer></script>
</head>

<body>
    <div id="preloader-container" class="preloader"></div>
    <header id="header-container"></header>

    <div class="banner-container fade-in-up">
        <div class="banner-wrapper">
            <img src="imgs/header_banners/btw_5.png" alt="banner" class="banner">
        </div>
        <div class="overlay"></div>
        <img src="imgs/logo_icon.svg" alt="logo" class="banner-logo">
    </div>

    <div class="games-block fade-in-up">
        <img src="imgs/header_banners/btw_3.png" alt="screen" class="bg">
        <div class="text">
            <p class="title">игры</p>
            <p class="description">Поиграйте и узнайте больше о наших играх!</p>
            <a href="games_list.html">подробнее</a>
        </div>
    </div>

    <div class="trailers-block fade-in-left">
        <div class="bg bg-1" style="background-image: url('imgs/header_banners/btw_1.png');"></div>
        <div class="bg bg-2" style="background-image: url('imgs/header_banners/lc_1.png');"></div>
        <div class="bg bg-3" style="background-image: url('imgs/header_banners/btw_2.png');"></div>

        <p class="title">трейлеры</p>
        <p class="description">Взгляните на наши трейлеры!</p>
        <a href="trailers.html">смотреть</a>
    </div>

    <footer id="footer-container"></footer>

    <script src="js/indexAnimations.js" defer></script>
    <script src="js/randomBanner.js" defer></script>
</body>
</html>