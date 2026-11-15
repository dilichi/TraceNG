// Grab the empty grid where the course cards will be placed.
const grid = document.getElementById('courseGrid');
const searchBox = document.getElementById('searchBox');
const emptyMsg = document.getElementById('emptyMsg');

let allCourses = [];

function renderCourses(list) {
  if (grid) grid.innerHTML = '';
  if (emptyMsg) emptyMsg.classList.toggle('d-none', list.length > 0);

  list.forEach(course => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <a href="routes.html?course=${course.id}" class="card h-100 rounded-4 shadow-sm p-4 text-decoration-none course-card">
        <div class="d-flex align-items-center gap-3">
          <div class="course-code fw-bold d-flex align-items-center justify-content-center">
            ${course.short}
          </div>
          <div>
            <div class="course-name fw-bold">${course.name}</div>
            <div class="course-meta small">${course.routes.length} career routes · ${course.journeys} journeys</div>
          </div>
        </div>
      </a>
    `;
    if (grid) grid.appendChild(col);
  });
}



// Load data
fetch('data/courses.json')
  .then(res => res.json())
  .then(data => {
    allCourses = data.courses;
    renderCourses(allCourses);
  })
  .catch(error => {
    if (grid) grid.textContent = 'Could not load courses. Run the page with Live Server.';
    console.error('Error loading courses:', error);
  });

// Search functionality
if (searchBox) {
  searchBox.addEventListener('input', () => {
    const q = searchBox.value.trim().toLowerCase();
    const filtered = allCourses.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.routes.some(r => r.name.toLowerCase().includes(q))
    );
    renderCourses(filtered);
  });
}