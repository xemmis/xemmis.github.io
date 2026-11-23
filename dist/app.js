const diameters = [14, 15, 16, 17, 18, 19, 20, 21, 22];
const services = [
  { id: 'change', name: 'Поменять колесо', description: 'Замена колеса в сборе или шины на диске.', prices: [16, 18, 20, 23, 26, 29, 32, 35, 38], assembledPrices: [9, 9.5, 10, 11, 12, 13, 14, 15, 16] },
  { id: 'repair', name: 'Ремонт прокола', description: 'Латка на прокол шины, проверка герметичности и установка.', quantity: 1, prices: [18, 19, 20, 22, 24, 26, 28, 30, 32] },
  { id: 'balance', name: 'Балансировка', description: 'Балансировка выбранного количества колёс.', prices: [7, 8, 9, 10, 11, 12, 13, 14, 15] },
];

function calculate(service, diameter, wheels, remount = true) {
  const prices = !remount && service.assembledPrices ? service.assembledPrices : service.prices;
  const price = prices[diameters.indexOf(diameter)];
  const quantity = service.quantity ?? wheels;
  return { price, total: price * quantity, quantity };
}

if (typeof module !== 'undefined') module.exports = { services, calculate };

if (typeof document !== 'undefined') {
  const find = (id) => document.getElementById(id);
  const serviceList = find('services');
  const diameter = find('diameter');
  const segmented = find('diameter-seg');
  const remount = find('remount');
  const wheelCount = find('wheel-count');
  const request = find('request');
  const prepare = find('prepare');
  const requestText = find('request-text');
  const copyStatus = find('copy-status');
  const money = new Intl.NumberFormat('ru-BY');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    change: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    repair: '<circle cx="12" cy="12" r="9"/><rect x="8" y="8" width="8" height="8" rx="1.5"/><path d="M10 12h4M12 10v4"/>',
    balance: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v3M12 18v3"/><rect x="10.5" y="3" width="3" height="3" rx=".5"/>',
  };
  let service = services[0];
  let shownTotal = 0;
  let counterFrame = 0;

  for (const size of diameters) diameter.add(new Option(`R${size}`, size, size === 16, size === 16));

  for (const size of diameters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.dataset.size = size;
    button.textContent = `R${size}`;
    button.setAttribute('aria-checked', String(size === 16));
    button.addEventListener('click', () => {
      diameter.value = String(size);
      syncSegments();
      diameter.dispatchEvent(new Event('change'));
    });
    segmented.append(button);
  }
  function syncSegments() {
    for (const button of segmented.children) {
      button.setAttribute('aria-checked', String(button.dataset.size === diameter.value));
    }
  }

  for (const item of services) {
    const label = document.createElement('label');
    label.className = 'service';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'service';
    radio.value = item.id;
    radio.checked = item === service;
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[item.id]}</svg>`;
    const copy = document.createElement('span');
    copy.className = 'copy';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const description = document.createElement('small');
    description.textContent = item.description;
    copy.append(name, description);
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>';
    label.append(radio, icon, copy, tick);
    serviceList.append(label);
    radio.addEventListener('change', () => {
      service = item;
      update();
    });
  }

  function currentEstimate() {
    return calculate(service, Number(diameter.value), Number(wheelCount.value), remount.value === 'yes');
  }

  function showTotal(target) {
    const totalEl = find('total');
    cancelAnimationFrame(counterFrame);
    if (reduceMotion || shownTotal === target) {
      shownTotal = target;
      totalEl.textContent = money.format(target);
      return;
    }
    const from = shownTotal;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 350, 1);
      const eased = 1 - (1 - t) ** 3;
      totalEl.textContent = money.format(Math.round(from + (target - from) * eased));
      if (t < 1) counterFrame = requestAnimationFrame(step);
      else shownTotal = target;
    };
    counterFrame = requestAnimationFrame(step);
    shownTotal = target;
  }

  function update() {
    const { price, total, quantity } = currentEstimate();
    const fixedQuantity = service.quantity !== undefined;
    const isRepair = service.id === 'repair';
    remount.closest('label').hidden = service.id !== 'change';
    wheelCount.disabled = fixedQuantity;
    wheelCount.closest('label').hidden = fixedQuantity;
    const note = find('quantity-note');
    note.hidden = !isRepair;
    note.textContent = 'Стоимость зависит от латки. Точную цену мастер назовёт после осмотра шины.';
    find('estimate-prefix').hidden = !isRepair;
    find('receipt-title').textContent = isRepair ? 'Ориентировочная стоимость' : 'Ваш расчёт';
    showTotal(total);
    const rate = isRepair ? 'за ремонт прокола одной шины' : `за колесо × ${quantity}`;
    find('breakdown').textContent = `R${diameter.value} · ${money.format(price)} BYN ${rate}`;
    request.hidden = true;
    prepare.setAttribute('aria-expanded', 'false');
    copyStatus.textContent = '';
  }

  diameter.addEventListener('change', () => { syncSegments(); update(); });
  remount.addEventListener('change', update);
  wheelCount.addEventListener('change', update);
  prepare.addEventListener('click', () => {
    const { total, quantity } = currentEstimate();
    requestText.value = [
      'Здравствуйте! Хочу уточнить стоимость и время визита.',
      `Услуга: ${service.name}.`,
      `Диаметр дисков: R${diameter.value}. Количество колёс: ${quantity}.`,
      service.id === 'change' && `Замена шины на диске: ${remount.value === 'yes' ? 'да' : 'нет, колесо в сборе'}.`,
      `Оценка по демо-прайсу: ${money.format(total)} BYN.`,
      service.id === 'repair' && 'Точную стоимость латки определит мастер после осмотра.',
    ].filter(Boolean).join('\n');
    copyStatus.textContent = '';
    request.hidden = false;
    prepare.setAttribute('aria-expanded', 'true');
    requestText.focus();
    requestText.setSelectionRange(0, 0);
    requestText.scrollTop = 0;
  });

  const copy = find('copy');
  copy.addEventListener('click', async () => {
    const text = requestText.value;
    copy.focus({ preventScroll: true });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (request.hidden || requestText.value !== text) return;
      requestText.focus();
      requestText.select();
      if (!document.execCommand('copy')) {
        copyStatus.textContent = 'Текст выделен. Скопируйте его через меню.';
        return;
      }
      copy.focus({ preventScroll: true });
    }
    if (!request.hidden && requestText.value === text) copyStatus.textContent = 'Заявка скопирована.';
  });
  update();

  // Плавное появление блоков при прокрутке
  const revealTargets = document.querySelectorAll('.estimate-grid, .estimate h2, .visit-grid, .case-head, .case-cards li');
  revealTargets.forEach((el) => el.classList.add('reveal'));
  const revealer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  revealTargets.forEach((el) => revealer.observe(el));
}
