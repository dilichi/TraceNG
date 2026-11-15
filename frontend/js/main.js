// tell the CSS that JavaScript is running, so it is safe to hide elements until they animate in
document.documentElement.classList.add('js');

let revealObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observeReveal();
  loadCourses();
  startTrace();
  setupForm();
});

function observeReveal() {
  document.querySelectorAll('.reveal:not(.in)').forEach((el) => revealObserver.observe(el));
}

// load courses directly from courses.json without external DB dependencies
async function loadCourses() {
  try {
    const res = await fetch('data/courses.json');
    const data = await res.json();
    const courses = data.courses;

    renderHeroCards(courses);
    renderCourseCards(courses);
    fillCourseSelect(courses);

  } catch (err) {
    console.error('Could not load courses', err);
    document.getElementById('courseGrid').innerHTML = '<p class="text-center text-muted">Could not load courses. Check your connection and refresh.</p>';
  }
}

// build the route preview cards on the right side of the hero
function renderHeroCards(courses) {
  const box = document.getElementById('heroCards');
  if (!box) return;
  box.innerHTML = courses.slice(0, 3).map((c, i) => `
    <a href="#courses" class="route-card d-flex align-items-center gap-3 p-3 mb-3 rounded-4 text-decoration-none" style="--d:${2.4 + i * 0.25}s">
      <span class="badge-circle">${c.short}</span>
      <span class="flex-grow-1">
        <small class="d-block fw-semibold" style="color:#1E7BF0">${c.name}</small>
        <strong class="d-block text-dark">${c.routes[0].name}</strong>
        <small class="text-muted">Verified from ${c.routes[0].journeys} graduate paths</small>
      </span>
      <span class="fs-3" style="color:#1E7BF0">&rsaquo;</span>
    </a>`).join('');
}

// build one card per course in the picker showing verified counts
function renderCourseCards(courses) {
  const grid = document.getElementById('courseGrid');
  if (!grid) return;
  
  grid.innerHTML = courses.map((c, i) => {
    // Total up journeys across all routes for this course
    const totalJourneys = c.routes.reduce((sum, r) => sum + r.journeys, 0);

    return `
      <div class="col">
        <button class="course-card reveal w-100 text-start p-4 rounded-4 border-0 bg-white shadow-sm" data-id="${c.id}" style="--d:${i * 0.1}s">
          <span class="badge-circle mb-3">${c.short}</span>
          <h3 class="h5 fw-bold text-dark">${c.name}</h3>
          <p class="text-muted mb-3">${totalJourneys} verified graduate paths</p>
          <span class="badge ${c.depth === 'deep' ? 'text-bg-primary' : 'text-bg-light border text-primary'}">${c.depth === 'deep' ? 'Deep' : 'Growing'}</span>
        </button>
      </div>`;
  }).join('');

  grid.querySelectorAll('.course-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const course = courses.find((c) => c.id === btn.dataset.id);
      showPanel(course, btn);
    });
  });

  observeReveal();
}

// open the panel and display all 15+ career professions with accurate distribution bars
function showPanel(course, button) {
  document.querySelectorAll('.course-card').forEach((b) => b.classList.remove('active'));
  button.classList.add('active');
  const panel = document.getElementById('coursePanel');

  const totalCourseJourneys = course.routes.reduce((sum, r) => sum + r.journeys, 0);

  const rows = course.routes.map((r) => {
    const pct = totalCourseJourneys > 0 ? Math.round((r.journeys / totalCourseJourneys) * 100) : 0;
    return `
      <div class="route-row mb-4">
        <div class="d-flex justify-content-between mb-2">
          <strong>${r.name}</strong>
          <span class="text-white-50">${r.journeys} of ${totalCourseJourneys} graduates (${pct}%)</span>
        </div>
        <div class="progress"><div class="bar progress-bar" data-w="${pct}"></div></div>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <p class="text-uppercase fw-bold small mb-1" style="color:#4DA3FF;letter-spacing:.12em">${course.depth === 'deep' ? 'Comprehensive Career Map' : 'Emerging Career Map'}</p>
    <h3 class="fw-bold mb-4">Where ${course.name} graduates went (${course.routes.length} verified professions)</h3>
    ${rows}
    <p class="small text-white-50 mb-0">Compiled from verified Nigerian graduate career tracking data across top industries.</p>`;

  panel.classList.remove('show');
  void panel.offsetWidth;
  panel.classList.add('show');
  
  requestAnimationFrame(() => {
    panel.querySelectorAll('.bar').forEach((b) => { b.style.width = b.dataset.w + '%'; });
  });
  
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function fillCourseSelect(courses) {
  const select = document.getElementById('fCourse');
  if (!select) return;
  select.innerHTML = '<option value="" selected disabled>Choose your course</option>' +
    courses.map((c) => `<option value="${c.name}">${c.name}</option>`).join('') +
    '<option value="Other">Other course</option>';
}

function startTrace() {
  const path = document.getElementById('tracePath');
  const dot = document.getElementById('traceDot');
  if (!path || !dot) return;
  if (window.innerWidth < 768) {
    path.ownerSVGElement.setAttribute('viewBox', '0 0 400 150');
    path.setAttribute('d', 'M -10 110 C 70 150, 130 40, 200 85 S 330 20, 410 70');
  }
  const len = path.getTotalLength();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = reduce ? 0 : len;
  const place = (p) => {
    const pt = path.getPointAtLength(len * p);
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
  };
  if (reduce) { place(0.5); dot.style.opacity = 1; return; }
  const DRAW = 3600, WAIT = 600;
  let start = null;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function frame(now) {
    if (start === null) start = now;
    const elapsed = now - start - WAIT;
    if (elapsed < 0) { requestAnimationFrame(frame); return; }
    if (elapsed < DRAW) {
      const p = ease(elapsed / DRAW);
      path.style.strokeDashoffset = len * (1 - p);
      place(p);
      dot.style.opacity = 1;
    } else {
      path.style.strokeDashoffset = 0;
      const loop = ((elapsed - DRAW) % 7000) / 7000;
      place(loop);
      dot.style.opacity = Math.sin(Math.PI * loop);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function setupForm() {
  const form = document.getElementById('journeyForm');
  const thanks = document.getElementById('formThanks');
  const modal = document.getElementById('journeyModal');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const entry = Object.fromEntries(new FormData(form).entries());
    entry.status = 'submitted';
    entry.date = new Date().toISOString();
    try {
      const list = JSON.parse(localStorage.getItem('traceng_pending') || '[]');
      list.push(entry);
      localStorage.setItem('traceng_pending', JSON.stringify(list));
    } catch (err) {
      console.warn('Could not save locally', err);
    }
    form.classList.add('d-none');
    thanks.classList.remove('d-none');
  });

  if (modal) {
    modal.addEventListener('hidden.bs.modal', () => {
      form.reset();
      form.classList.remove('was-validated');
      form.classList.remove('d-none');
      thanks.classList.add('d-none');
    });
  }
}

document.querySelectorAll('#menu a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    setTimeout(() => {
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  });
});