document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');

    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('mainContent');
    const courseLabel = document.getElementById('courseLabel');
    const pageTitle = document.getElementById('pageTitle');
    const pageSub = document.getElementById('pageSub');
    const routeGrid = document.getElementById('routeGrid');
    const organisationGrid = document.getElementById('organisationGrid');

    if (!courseId) {
        if(preloader) preloader.classList.add('d-none');
        if(mainContent) mainContent.classList.remove('d-none');
        if(pageTitle) pageTitle.textContent = 'No Course Selected';
        if(pageSub) pageSub.textContent = 'Please return to the courses page and select a course.';
        return;
    }

    try {
        // Fetch the data
        const [coursesRes, orgsRes] = await Promise.all([
            fetch('data/courses.json'),
            fetch('data/organisations.json')
        ]);

        if (!coursesRes.ok) throw new Error('Failed to load courses data.');
        
        const coursesData = await coursesRes.json();
        const orgsData = orgsRes.ok ? await orgsRes.json() : { organisations: [] };

        const course = coursesData.courses.find(c => c.id === courseId);
        if (!course) throw new Error('Course not found.');

        // Slight delay for the preloader effect
        setTimeout(() => {
            if(preloader) preloader.classList.add('d-none');
            if(mainContent) mainContent.classList.remove('d-none');

            // Update Headers
            if(courseLabel) courseLabel.textContent = course.name;
            if(pageTitle) pageTitle.textContent = `${course.name} Career Routes`;
            if(pageSub) pageSub.textContent = `Explore the verified career paths and potential organisations for ${course.name} graduates.`;

            // Render Career Route Cards
            if(routeGrid) {
                routeGrid.innerHTML = course.routes.map((route, index) => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 p-4">
                            <h4 class="fw-bold mb-3">${route.name}</h4>
                            <p class="small mb-4">Built from ${route.journeys || 'several'} journeys</p>
                            <a href="journey.html?course=${course.id}&route=${index}" class="text-info fw-bold text-decoration-none mt-auto">
                                View the steps &rarr;
                            </a>
                        </div>
                    </div>
                `).join('');
            }

            // Render Organisations
            const organisations = orgsData.organisations || [];
            
            // Filter orgs matching the current courseId
            const relevantOrgs = organisations.filter(org => 
                org.courses && org.courses.includes(courseId)
            );

            if (relevantOrgs.length > 0 && organisationGrid) {
                organisationGrid.innerHTML = relevantOrgs.map(org => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 p-4">
                            <h4 class="fw-bold mb-2">${org.name}</h4>
                            <p class="small mb-4">${org.description || 'Explore opportunities.'}</p>
                            
                            <a href="${org.website}" target="_blank" class="text-info fw-bold text-decoration-none mt-auto">
                                Explore this company &rarr;
                            </a>
                        </div>
                    </div>
                `).join('');
            } else if (organisationGrid) {
                organisationGrid.innerHTML = `<div class="col-12 text-white-50">No specific organisations listed for this course yet.</div>`;
            }

        }, 800); 

    } catch (error) {
        console.error(error);
        if(preloader) preloader.classList.add('d-none');
        if(mainContent) mainContent.classList.remove('d-none');
        if(pageTitle) pageTitle.textContent = 'Error Loading';
        if(pageSub) pageSub.textContent = error.message;
    }
});