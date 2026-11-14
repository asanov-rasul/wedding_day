const envelopeScreen = document.querySelector('#envelope-screen');
const openingScreen = document.querySelector('#opening-screen');
const invitation = document.querySelector('#invitation');
const openButton = document.querySelector('#open-invitation');
const openingVideo = document.querySelector('#opening-video');
const skipOpening = document.querySelector('#skip-opening');
const music = document.querySelector('#background-music');
const musicToggle = document.querySelector('#music-toggle');
const heroVideo = document.querySelector('.hero-video');
const timeline = document.querySelector('.timeline');

const weddingDate = new Date('2027-04-17T17:00:00+05:00');
let countdownTimer;
let timelineUpdateFrame = 0;
let openingRevealFrame = 0;

function revealNearOpeningEnd() {
  openingRevealFrame = 0;
  const remaining = openingVideo.duration - openingVideo.currentTime;

  if (Number.isFinite(remaining) && remaining <= 0.5) {
    revealPage();
    return;
  }

  openingRevealFrame = window.requestAnimationFrame(revealNearOpeningEnd);
}

function updateTimelineFlower() {
  if (timelineUpdateFrame || !timeline) return;

  timelineUpdateFrame = window.requestAnimationFrame(() => {
    timelineUpdateFrame = 0;
    const flower = timeline.querySelector('.timeline-flower');
    const items = timeline.querySelectorAll('li');
    if (!flower || items.length < 2) return;

    const timelineRect = timeline.getBoundingClientRect();
    const firstRect = items[0].getBoundingClientRect();
    const lastRect = items[items.length - 1].getBoundingClientRect();
    const firstCenter = firstRect.top - timelineRect.top + firstRect.height / 2;
    const lastCenter = lastRect.top - timelineRect.top + lastRect.height / 2;
    const centerInTimeline = window.innerHeight * 0.46 - timelineRect.top;
    const flowerCenter = Math.min(lastCenter, Math.max(firstCenter, centerInTimeline));
    const y = flowerCenter - flower.offsetHeight / 2;

    flower.style.setProperty('--flower-y', `${y}px`);
  });
}

function startCountdown() {
  const units = {
    days: document.querySelector('#days'),
    hours: document.querySelector('#hours'),
    minutes: document.querySelector('#minutes'),
    seconds: document.querySelector('#seconds'),
  };

  function updateValue(element, value) {
    const previous = element.dataset.value ?? element.textContent.trim();
    if (previous === value) return;

    element.dataset.value = value;
    if (previous === '—') {
      element.textContent = value;
      return;
    }

    const outgoing = document.createElement('span');
    outgoing.className = 'countdown-value countdown-value--out';
    outgoing.textContent = previous;

    const incoming = document.createElement('span');
    incoming.className = 'countdown-value countdown-value--in';
    incoming.textContent = value;
    incoming.addEventListener('animationend', () => {
      if (element.dataset.value === value) element.textContent = value;
    }, { once: true });

    element.replaceChildren(outgoing, incoming);
  }

  function update() {
    const secondsLeft = Math.max(0, Math.floor((weddingDate.getTime() - Date.now()) / 1000));
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    updateValue(units.days, String(days).padStart(2, '0'));
    updateValue(units.hours, String(hours).padStart(2, '0'));
    updateValue(units.minutes, String(minutes).padStart(2, '0'));
    updateValue(units.seconds, String(seconds).padStart(2, '0'));
  }

  update();
  countdownTimer = window.setInterval(update, 1000);
}

function setMusicState(isPlaying) {
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Выключить музыку' : 'Включить музыку');
}

async function playMusic() {
  try {
    music.volume = 0.38;
    await music.play();
    setMusicState(true);
  } catch {
    setMusicState(false);
  }
}

function revealPage() {
  if (!invitation.hidden) return;
  window.cancelAnimationFrame(openingRevealFrame);
  openingRevealFrame = 0;
  window.clearInterval(countdownTimer);
  openingVideo.pause();
  envelopeScreen.hidden = true;
  openingScreen.hidden = true;
  invitation.hidden = false;
  musicToggle.hidden = false;
  startCountdown();
  observeSections();
  updateTimelineFlower();
  if (heroVideo) heroVideo.play().catch(() => {});
  playMusic();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function openInvitation() {
  envelopeScreen.hidden = true;
  openingScreen.hidden = false;
  playMusic();

  openingVideo.currentTime = 0;
  openingVideo.play().then(() => {
    openingRevealFrame = window.requestAnimationFrame(revealNearOpeningEnd);
  }).catch(() => {
    window.setTimeout(revealPage, 900);
  });
}

function observeSections() {
  const sections = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13 });

  sections.forEach((section) => observer.observe(section));
}

openButton.addEventListener('click', openInvitation);
skipOpening.addEventListener('click', revealPage);
openingVideo.addEventListener('ended', revealPage);

musicToggle.addEventListener('click', async () => {
  if (music.paused) {
    await playMusic();
  } else {
    music.pause();
    setMusicState(false);
  }
});

music.addEventListener('play', () => setMusicState(true));
music.addEventListener('pause', () => setMusicState(false));

window.addEventListener('scroll', updateTimelineFlower, { passive: true });
window.addEventListener('resize', updateTimelineFlower);

// Keep the invitation usable if the opening animation cannot be decoded.
openingVideo.addEventListener('error', revealPage, { once: true });
