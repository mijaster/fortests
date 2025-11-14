export function getAverageColor(
  imagePath,
  darknessFactor = 0.67,
  blueBias = 1.4,
  luminanceThreshold = 120
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = this.naturalWidth || this.width;
      canvas.height = this.naturalHeight || this.height;

      ctx.drawImage(img, 0, 0);

      try {
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha === 0) continue;

          const alphaRatio = alpha / 255;
          r += data[i] * alphaRatio;
          g += data[i + 1] * alphaRatio;
          b += data[i + 2] * alphaRatio * blueBias;
          pixelCount++;
        }

        if (pixelCount === 0) {
          resolve('rgb(100, 100, 120)');
          return;
        }

        r = r / pixelCount;
        g = g / pixelCount;
        b = b / pixelCount;

        r = Math.floor(r * darknessFactor);
        g = Math.floor(g * darknessFactor);
        b = Math.floor(b * darknessFactor);

        if (b > r && b > g) {
          b = Math.min(255, Math.floor(b * 1.05));
        }

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance > luminanceThreshold) {
          resolve('var(--light-bg-color)');
        } else {
          resolve(`rgb(${r}, ${g}, ${b})`);
        }
      } catch (e) {
        reject(new Error("Не удалось получить пиксели: " + e.message));
      }
    };

    img.onerror = () => {
      reject(new Error("Не удалось загрузить изображение: " + imagePath));
    };

    img.src = imagePath;

    if (img.complete && img.naturalWidth > 0) {
      img.onload();
    }
  });
}
