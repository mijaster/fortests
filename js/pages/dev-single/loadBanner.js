document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const devId = urlParams.get('id');

  if (!devId) return;

  const container = document.getElementById('banner-container');
  if (!container) return;

  try {
    const response = await fetch('/json/devs.json');
    if (!response.ok) throw new Error();

    const devs = await response.json();
    const dev = devs[devId];
    if (!dev?.banner) return;

    const card = document.createElement('div');
    card.className = 'trailer-card';

    if (dev.banner.endsWith('.mp4')) {
      card.innerHTML = `
        <video class="trailer-preview" muted loop>
          <source src="assets/pages/devs/${devId}/${dev.banner}" type="video/mp4">
        </video>
        <div class="trailer-play-button">
          <i class="fas fa-play"></i>
        </div>
      `;
    } else {
      card.innerHTML = `
        <img class="trailer-preview" src="assets/pages/devs/${devId}/${dev.banner}" alt="Баннер">
      `;
    }

    container.appendChild(card);
  } catch (err) {
    console.error('Error loading banner:', err);
  }
});
