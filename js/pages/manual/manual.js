document.addEventListener('DOMContentLoaded', async () => {
  const currentStepEl = document.getElementById('current-step');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  let steps = [];
  let currentStep = 0;

  try {
    const response = await fetch('json/manual.json');
    if (!response.ok) throw new Error('Failed to load manual.json');
    steps = await response.json();
  } catch (error) {
    currentStepEl.textContent = 'Ошибка загрузки инструкции. Проверьте файл manual.json.';
    console.error(error);
    return;
  }

  const totalSteps = steps.length;

  function updateUI() {
    currentStepEl.textContent = steps[currentStep];
    const progress = ((currentStep + 1) / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Шаг ${currentStep + 1} из ${totalSteps}`;

    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === totalSteps - 1;
  }

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateUI();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep < totalSteps - 1) {
      currentStep++;
      updateUI();
    }
  });

  updateUI();
});
