/* Dra. Paola Romero · interacción y movimiento */
(() => {
  const WA = '573143941802';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => window.matchMedia('(max-width: 760px)').matches;
  const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const peso = (n) => '$' + n.toLocaleString('es-CO');

  /* ───── ¿abierto ahora? (hora de Bogotá) ───── */
  const HOURS = { 0: [600, 780] }; // domingo 10:00–13:00
  for (let d = 1; d <= 6; d++) HOURS[d] = [570, 1170]; // lunes a sábado 9:30–19:30
  const fmt = (m) => {
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); // taste-skill-ignore: minutos del reloj
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${mm} ${h < 12 ? 'a. m.' : 'p. m.'}`;
  };
  function bogota() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
  }
  const status = $('[data-status]');
  function paintStatus() {
    if (!status) return;
    const { day, min } = bogota();
    const [open, close] = HOURS[day];
    const text = $('[data-status-text]', status);
    if (min >= open && min < close) {
      status.classList.add('is-open');
      text.textContent = `Abierto ahora · hoy cierra a las ${fmt(close)}`;
    } else {
      status.classList.remove('is-open');
      let next;
      if (min < open) next = `abre hoy a las ${fmt(open)}`;
      else {
        const tomorrow = (day + 1) % 7;
        next = `abre mañana a las ${fmt(HOURS[tomorrow][0])}`;
      }
      text.textContent = `Cerrado ahora, ${next} · urgencias 24 h por WhatsApp`;
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ───── arma tu consulta ───── */
  const planner = $('[data-planner]');
  if (planner) {
    const list = $('[data-summary-list]', planner);
    const total = $('[data-summary-total]', planner);
    const wa = $('[data-summary-wa]', planner);
    const update = () => {
      const picked = $$('input:checked', planner);
      const sum = picked.reduce((s, i) => s + Number(i.dataset.price), 0);
      total.textContent = peso(sum);
      if (picked.length) {
        list.textContent = picked.map((i) => i.value).join(', ');
        list.classList.add('has-items');
        const lines = picked.map((i) => `- ${i.value} (desde ${peso(Number(i.dataset.price))})`).join('\n');
        wa.href = waLink(`Hola Dra. Paola, quiero pedir una valoración para:\n${lines}\nMi nombre es: `);
      } else {
        list.textContent = 'Marca uno o varios tratamientos.';
        list.classList.remove('has-items');
        wa.href = waLink('Hola Dra. Paola, quiero pedir una valoración.');
      }
    };
    planner.addEventListener('change', update);
    update();
  }

  /* ───── antes / después ───── */
  $$('[data-ba-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tile = btn.closest('.tile');
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'Ver después' : 'Ver antes';
      tile.classList.toggle('is-before', on);
    });
  });

  /* ───── videos: sonido y pausa fuera de pantalla ───── */
  const heroVideo = $('[data-hero-video]');
  const soundBtn = $('[data-sound]');
  // en silencio corre el tramo en que el paciente sonríe; con sonido, el testimonio completo
  const setSound = (on) => {
    if (!heroVideo) return;
    heroVideo.src = on ? heroVideo.dataset.full : heroVideo.dataset.loop;
    heroVideo.muted = !on;
    heroVideo.loop = !on;
    heroVideo.play().catch(() => {});
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.textContent = on ? 'Silenciar' : 'Escuchar al paciente';
    }
  };
  if (heroVideo && soundBtn) {
    soundBtn.addEventListener('click', () => setSound(heroVideo.muted));
    heroVideo.addEventListener('ended', () => setSound(false));
  }
  if (reduce && heroVideo) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  const roomVideo = $('.room__media[data-room-item="0"]');
  const inView = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      inView.set(e.target, e.isIntersecting);
      const v = e.target;
      if (reduce) return;
      if (v === roomVideo && !v.classList.contains('is-active')) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
  }, { threshold: 0.2 });
  [heroVideo, roomVideo].forEach((v) => v && io.observe(v));

  /* ───── el consultorio: índice con vista previa ───── */
  const names = $$('[data-room]');
  const arch = $('[data-room-arch]');
  const fact = $('[data-room-fact]');
  const medias = $$('[data-room-item]');
  function choose(btn) {
    const idx = btn.dataset.room;
    names.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    medias.forEach((m) => {
      const on = m.dataset.roomItem === idx;
      m.classList.toggle('is-active', on);
      if (m.tagName === 'VIDEO') {
        if (on && !reduce && inView.get(m) !== false) m.play().catch(() => {});
        else m.pause();
      }
    });
    arch.dataset.tone = btn.dataset.tone;
    fact.textContent = btn.dataset.fact;
  }
  names.forEach((btn) => {
    btn.addEventListener('click', () => choose(btn));
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      btn.addEventListener('mouseenter', () => choose(btn));
      btn.addEventListener('focus', () => choose(btn));
    }
  });

  /* ───── movimiento ───── */
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap || reduce) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // desplazamiento suave solo con ratón
  let lenis = null;
  if (window.Lenis && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        const id = a.getAttribute('href');
        const target = id === '#inicio' ? 0 : $(id);
        if (target === null) return;
        ev.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.2 });
        history.replaceState(null, '', id);
      });
    });
  }

  // entradas: cada elemento entra cuando llega a la pantalla o cuando ya quedó atrás
  // (un salto con el menú nunca deja contenido escondido)
  const pending = new Set();
  $$('[data-reveal]').forEach((el) => {
    if (el.dataset.reveal === 'picture') {
      const img = $('img, video', el);
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      if (img) gsap.set(img, { scale: 1.12 });
    } else if (phone()) {
      // en el celular el texto nunca arranca invisible: sube y se aclara
      gsap.set(el, { y: 14, opacity: 0.25 });
    } else {
      gsap.set(el, { y: 26, autoAlpha: 0 });
    }
    pending.add(el);
  });
  const show = (els) => {
    const pics = els.filter((e) => e.dataset.reveal === 'picture');
    const rest = els.filter((e) => e.dataset.reveal !== 'picture');
    if (rest.length) gsap.to(rest, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.075, overwrite: true });
    pics.forEach((p, i) => {
      const img = $('img, video', p);
      gsap.to(p, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', delay: i * 0.08 });
      if (img) gsap.to(img, { scale: 1, duration: 1.6, ease: 'expo.out', delay: i * 0.08 });
    });
  };
  let ticking = false;
  const sweep = () => {
    ticking = false;
    const limit = window.innerHeight * 0.9;
    const due = [];
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < limit) { due.push(el); pending.delete(el); }
    });
    if (due.length) show(due);
  };
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  if (lenis) lenis.on('scroll', ask);
  sweep();

  // cifras de la arcada
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const obj = { v: 0 };
    el.textContent = (0).toFixed(dec).replace('.', ',');
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.6, ease: 'expo.out',
        onUpdate: () => { el.textContent = obj.v.toFixed(dec).replace('.', ','); },
      }),
    });
  });

  // el arco del inicio cede con el scroll
  gsap.to('.hero__arch', {
    yPercent: 7, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__card', {
    yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // las arcadas suben a ritmos distintos, como dientes
  $$('.arcade__arch').forEach((a, i) => {
    gsap.fromTo(a, { yPercent: 4 + i * 2 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.arcade', start: 'top bottom', end: 'bottom 70%', scrub: true },
    });
  });

  // el nombre del pie se levanta letra por letra
  gsap.from('.foot__mark .fm-l', {
    y: 60, duration: 1.1, ease: 'expo.out', stagger: 0.04,
    scrollTrigger: { trigger: '.foot__mark', start: 'top 92%', once: true },
  });

  /* ───── escena: la fachada se abre desde el arco ───── */
  const visit = $('[data-opening]');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1100px)', () => {
    if (!visit) return;
    const stage = $('.visit__stage', visit);
    const photo = $('.visit__photo', visit);
    const card = $('[data-visit-card]', visit);
    visit.classList.add('is-live');
    const type = document.createElement('div');
    type.className = 'visit__type';
    type.setAttribute('aria-hidden', 'true');
    type.innerHTML = '<span data-t="Calle 42A Sur"></span><span data-t="#79C-36"></span>';
    stage.prepend(type);
    gsap.set(card, { autoAlpha: 0, y: 40 });
    const [left, right] = type.children;
    const draw = (p) => {
      const vw = stage.clientWidth, vh = stage.clientHeight;
      const e = gsap.parseEase('power2.inOut')(Math.min(1, p / 0.72));
      const x = (1 - e) * vw * 0.34;
      const t = (1 - e) * vh * 0.1;
      const b = (1 - e) * vh * 0.06;
      const r = ((vw - 2 * x) / 2) * (1 - e);
      stage.style.setProperty('--clip', `inset(${t}px ${x}px ${b}px ${x}px round ${r}px ${r}px 0px 0px)`);
      photo.style.transform = `scale(${1.14 - 0.14 * e})`;
      // la puerta que se abre empuja la dirección hacia los lados
      const push = vw * 0.34 - x;
      left.style.transform = `translateX(${-push}px)`;
      right.style.transform = `translateX(${push}px)`;
      type.style.opacity = String(1 - Math.min(1, e * 2.4));
      const c = Math.max(0, Math.min(1, (p - 0.66) / 0.18));
      gsap.set(card, { autoAlpha: c, y: 40 * (1 - c) });
    };
    const st = ScrollTrigger.create({
      trigger: visit, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => draw(self.progress),
      onRefresh: (self) => draw(self.progress),
    });
    draw(0);
    return () => {
      st.kill();
      visit.classList.remove('is-live');
      type.remove();
      stage.style.removeProperty('--clip');
      photo.style.transform = '';
      gsap.set(card, { clearProps: 'all' });
    };
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
