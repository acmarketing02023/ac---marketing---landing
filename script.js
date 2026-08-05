// ── STAGGERED REVEAL: assign --i per child so CSS can offset each one's delay ──
document.querySelectorAll('.process-list, .faq-list, .book-perks, .stats-inner').forEach(group => {
  Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
});

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
reveals.forEach(el => revealObs.observe(el));

// ── SCROLL-DRIVEN CHROME: progress bar, navbar shrink, back-to-top, hero parallax ──
const scrollProgress = document.querySelector('.scroll-progress');
const navbar = document.querySelector('.navbar');
const backTop = document.querySelector('.back-top');
const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');

let ticking = false;
function updateOnScroll() {
  const scrollTop = window.scrollY;

  if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    scrollProgress.style.width = pct + '%';
  }

  if (navbar) navbar.classList.toggle('scrolled', scrollTop > 40);
  if (backTop) backTop.classList.toggle('visible', scrollTop > 400);

  if (hero && heroContent) {
    const heroHeight = hero.offsetHeight;
    const y = Math.min(scrollTop, heroHeight);
    const progress = heroHeight > 0 ? y / heroHeight : 0;
    heroContent.style.transform = `translateY(${y * 0.16}px)`;
    heroContent.style.opacity = String(1 - progress * 0.85);
  }

  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(updateOnScroll); ticking = true; }
}, { passive: true });
updateOnScroll();

if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── FAQ ACCORDION ──
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const btn = item.querySelector('.faq-question');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    faqItems.forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ── BOOKING FORM: MIN DATE = TODAY ──
const preferredDay = document.getElementById('preferred_day');
if (preferredDay) preferredDay.min = new Date().toISOString().split('T')[0];

// ── BOOKING FORMS: PUSH LEADS INTO THE CRM ──
// In addition to the normal Netlify Forms submission, we relay the same
// data to the Setter CRM so it shows up as a booking immediately.
const CRM_LEADS_ENDPOINT = 'https://setter-crm-kappa.vercel.app/api/leads/inbound';
const CRM_WEBHOOK_SECRET = '0bf0af92295794c8f1d1a99698cf5fa78d7bd4e1b13f5821';

function setupFormSubmission(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    // Honeypot: if the hidden bot-field got filled in, silently drop the
    // submission but still show the thank-you page
    if (formData.get('bot-field')) {
      window.location.href = '/thank-you.html';
      return;
    }

    const encoded = new URLSearchParams(formData).toString();

    const netlifySubmit = fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encoded,
    }).catch(() => {});

    const crmSubmit = fetch(CRM_LEADS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': CRM_WEBHOOK_SECRET,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    }).catch(() => {});

    Promise.allSettled([netlifySubmit, crmSubmit]).finally(() => {
      window.location.href = '/thank-you.html';
    });
  });
}

// Handle both hero form and booking form
setupFormSubmission('.hero-form');
setupFormSubmission('.book-form');
