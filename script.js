(() => {
  'use strict';

  /* ===================== 1) สเกล stage ให้เต็มจอ ===================== */
  const DESIGN_W = 1920, DESIGN_H = 1080;
  const stage = document.getElementById('stage');

  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const cover = Math.max(w / DESIGN_W, h / DESIGN_H); // desktop: เต็มจอ (full screen)
    const contain = Math.min(w / DESIGN_W, h / DESIGN_H); // จอเล็ก: เห็นครบทั้งภาพ
    stage.style.setProperty('--scale', w >= 1024 ? cover : contain);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ===================== 2) ตัวเลขสุ่ม ===================== */
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const cards = [1, 2, 3, 4].map(i => {
    const el = document.getElementById('num' + i);
    return {
      el,
      min: +el.dataset.min,
      max: +el.dataset.max,
      value: 0,
      raf: 0,
      timer: 0
    };
  });

  // นับเลขวิ่งไปยังค่าใหม่แบบนุ่มนวล
  function animateTo(card, to, dur = 400) {
    cancelAnimationFrame(card.raf);
    const from = card.value, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      card.value = Math.round(from + (to - from) * e);
      card.el.textContent = card.value;
      if (p < 1) card.raf = requestAnimationFrame(step);
    };
    card.raf = requestAnimationFrame(step);
  }

  function randomize(card, animate = true) {
    let next;
    do { next = rand(card.min, card.max); } while (next === card.value && card.max > card.min);
    if (animate) animateTo(card, next);
    else { card.value = next; card.el.textContent = next; }
  }

  // เริ่มต้น: สุ่มค่าใหม่ทุกครั้งที่โหลดหน้า
  cards.forEach(c => randomize(c, false));

  /* ===================== 3) Toggle: กดหรือลากได้ =====================
     - กด (คลิก/แตะ/Space/Enter) = สลับ เปิด/ปิด
     - ลากปุ่มกลมไปซ้าย-ขวา = ปรับค่า แล้วปล่อยเพื่อล็อกที่ปลายใกล้สุด
     - เปิด (ขวา) = ตัวเลขช่องนั้นสุ่มเปลี่ยนต่อเนื่อง
     - ปิด (ซ้าย) = ตัวเลขหยุดค้างที่ค่าปัจจุบัน                       */
  const TICK_MS = 1200;

  function setState(tg, card, on) {
    tg.setAttribute('aria-checked', String(on));
    tg.style.setProperty('--pos', on ? 1 : 0);
    clearInterval(card.timer);
    if (on) {
      randomize(card);
      card.timer = setInterval(() => randomize(card), TICK_MS);
    }
  }

  document.querySelectorAll('.toggle').forEach(tg => {
    const card = cards[+tg.id.replace('tg', '') - 1];
    let dragging = false, moved = false, startX = 0, startPos = 0, travel = 1;

    const scale = () => parseFloat(getComputedStyle(stage).getPropertyValue('--scale')) || 1;
    const isOn = () => tg.getAttribute('aria-checked') === 'true';

    tg.addEventListener('pointerdown', e => {
      dragging = true; moved = false;
      startX = e.clientX;
      startPos = isOn() ? 1 : 0;
      travel = (tg.offsetWidth - 70) * scale();   // ระยะเลื่อนจริงบนหน้าจอ
      tg.setPointerCapture(e.pointerId);
      tg.classList.add('dragging');
    });

    tg.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (!moved) return;
      const pos = Math.min(1, Math.max(0, startPos + dx / travel));
      tg.style.setProperty('--pos', pos);
      tg.dataset.pos = pos;
    });

    const end = e => {
      if (!dragging) return;
      dragging = false;
      tg.classList.remove('dragging');
      if (tg.hasPointerCapture(e.pointerId)) tg.releasePointerCapture(e.pointerId);
      if (moved) {
        setState(tg, card, parseFloat(tg.dataset.pos) >= 0.5);   // ลาก → ล็อกปลายใกล้สุด
      } else {
        setState(tg, card, !isOn());                              // กด → สลับ
      }
    };
    tg.addEventListener('pointerup', end);
    tg.addEventListener('pointercancel', end);

    // คีย์บอร์ด
    tg.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setState(tg, card, !isOn()); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setState(tg, card, true); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setState(tg, card, false); }
    });
  });
})();
