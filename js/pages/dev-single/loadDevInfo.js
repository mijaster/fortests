document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const devId = urlParams.get('id');

  if (!devId) {
    document.getElementById('dev-name').textContent = 'Не найден';
    return;
  }

  if (devId != "ms") {
    document.getElementById('header-games').textContent = 'Совместные игры с Mijaster Studios';
  }

  fetch('json/devs.json')
    .then(res => res.json())
    .then(data => {
      const dev = data[devId];
      if (!dev) {
        document.getElementById('dev-name').textContent = 'Не найден';
        return;
      }

      const bannerEl = document.getElementById('dev-banner');
      if (dev.banner) {
        if (dev.banner.endsWith('.mp4')) {
          bannerEl.innerHTML = `
            <video autoplay muted loop playsinline>
              <source src="assets/pages/devs/${devId}/${dev.banner}" type="video/mp4">
            </video>
          `;
        } else {
          bannerEl.style.backgroundImage = `url(assets/pages/devs/${devId}/${dev.banner})`;
        }
      } else if (dev.bg) {
        if (dev.bg.startsWith('linear-gradient') || dev.bg.startsWith('#')) {
          bannerEl.style.background = dev.bg;
        } else {
          bannerEl.style.backgroundImage = `url(assets/pages/devs/${devId}/${dev.bg})`;
        }
      }

      document.getElementById('dev-name').textContent = dev.name;

      const logoEl = document.getElementById('dev-logo');
      logoEl.src = `assets/pages/devs/${devId}/${dev.logo}`;
      logoEl.onerror = () => logoEl.style.display = 'none';

      const descriptionEl = document.getElementById('dev-description');
        const descriptionSection = document.querySelector('.dev-description-section');

        if (dev.description) {
        descriptionEl.innerHTML = dev.description;
        } else {
        descriptionSection.style.display = 'none';
        }


      const contactsEl = document.getElementById('dev-contacts');
      if (dev.contacts && dev.contacts.length > 0) {
        contactsEl.classList.add('dev-contact-icons');

        dev.contacts.forEach(link => {
          const a = document.createElement('a');
          a.href = link;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.classList.add('contact-icon');

          const icon = document.createElement('i');
          const { iconClass } = getPlatformInfo(link);

          icon.className = iconClass;
          a.appendChild(icon);
          contactsEl.appendChild(a);
        });
      } else {
        contactsEl.style.display = 'none';
      }

      if (dev.screens && dev.screens.length > 0) {
        document.getElementById('screenshots-section').classList.remove('empty');
        document.getElementById('screenshots-section').style.display = 'block';
      }
    })
    .catch(err => {
      console.error('Ошибка:', err);
      document.getElementById('dev-name').textContent = 'Ошибка';
    });

  function getPlatformInfo(url) {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');

      switch (hostname) {
        case 't.me':           return { iconClass: 'fab fa-telegram-plane' };
        case 'discord.gg':
        case 'discord.com':    return { iconClass: 'fab fa-discord' };
        case 'vk.com':         return { iconClass: 'fab fa-vk' };
        case 'youtube.com':
        case 'youtu.be':       return { iconClass: 'fab fa-youtube' };
        case 'twitter.com':
        case 'x.com':          return { iconClass: 'fab fa-x-twitter' };
        case 'instagram.com':  return { iconClass: 'fab fa-instagram' };
        case 'github.com':     return { iconClass: 'fab fa-github' };
        default:               return { iconClass: 'fas fa-link' };
      }
    } catch {
      return { iconClass: 'fas fa-link' };
    }
  }
});
