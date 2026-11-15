
// ============================================
// 1. GET THE HTML ELEMENTS WE NEED
// ============================================

// Gets the course name element.
const courseLabel = document.getElementById('courseLabel');

// Gets the career route heading.
const routeTitle = document.getElementById('routeTitle');

// Gets the career route description.
const routeSummary = document.getElementById('routeSummary');

// Gets the container where timeline steps will appear.
const timeline = document.getElementById('timeline');

// Gets the container where skill badges will appear.
const skillsBox = document.getElementById('skills');

// Gets the advice card.
const adviceBox = document.getElementById('adviceBox');

// Gets the advice text element.
const adviceText = document.getElementById('adviceText');

// Gets the back button.
const backLink = document.getElementById('backLink');

// Gets the gap assessment button.
const gapLink = document.getElementById('gapLink');

// Gets the timeline wrapper.
const timelineWrap = document.getElementById('timelineWrap');

// Gets the animated trace line.
const traceLine = document.getElementById('traceLine');

// Gets the glowing dot.
const traceDot = document.getElementById('traceDot');

// Gets the graduate profile card.
const profileCard = document.getElementById('profileCard');

// Gets the challenges section.
const challengesBox = document.getElementById('challengesBox');

// Gets the list where challenges will appear.
const challengeList = document.getElementById('challengeList');


// ============================================
// 2. READ THE URL PARAMETERS
// ============================================

// Reads the parameters from the current page URL.
const params = new URLSearchParams(window.location.search);

// Gets the selected course ID from the URL.
const courseId = params.get('course');

// Gets the selected career route number from the URL.
const routeParam = params.get('route');

// Converts the route number into a JavaScript number.
const routeIndex = Number(routeParam);


// ============================================
// 3. TIMELINE BADGE STYLES
// ============================================

// Defines the Bootstrap badge styles for each step type.
const typeStyles = {
    skill: 'text-bg-primary',
    project: 'text-bg-info',
    internship: 'text-bg-warning',
    certification: 'text-bg-success',
    job: 'text-bg-light'
};


// ============================================
// 4. ANIMATE THE TRACE LINE
// ============================================

// Updates the trace line as the user scrolls.
function updateTrace() {

    // Stops if any required timeline element is missing.
    if (!traceLine || !traceDot || !timelineWrap) return;

    // Gets the timeline's position and dimensions.
    const rect = timelineWrap.getBoundingClientRect();

    // Checks that the timeline has a measurable height.
    if (rect.height <= 0) return;

    // Sets the point where the trace animation should follow.
    const anchor = window.innerHeight * 0.5;

    // Calculates how far the user has scrolled through the timeline.
    const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));

    // Converts the progress into a pixel position.
    const y = progress * rect.height;

    // Changes the height of the bright trace line.
    traceLine.style.height = `${y}px`;

    // Moves the glowing dot to the end of the trace line.
    traceDot.style.top = `${y}px`;

}


// Runs the trace animation whenever the user scrolls.
window.addEventListener('scroll', updateTrace, { passive: true });

// Updates the animation when the browser window is resized.
window.addEventListener('resize', updateTrace);


// ============================================
// 5. HTML ESCAPING FUNCTION
// ============================================

// Makes sure text from JSON or submitted journeys is displayed safely.
function escapeHtml(str) {

    // Returns an empty string if the value is missing.
    if (str === null || str === undefined) return '';

    // Converts the value to a string and escapes special characters.
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ============================================
// 6. LOAD COMMUNITY JOURNEY PREVIEWS
// ============================================

// Loads the latest community submissions from the backend.
async function loadHomeJourneyPreviews() {

    // Gets the community journey container.
    const container = document.getElementById('journeyPreviewContainer');

    // Stops if the container does not exist on this page.
    if (!container) return;

    try {

        // Requests community journeys from the backend.
        // Keep port 5000 if that is the port your backend uses.
        const response = await fetch('http://127.0.0.1:5000/api/journeys');

        // Checks whether the server returned a successful response.
        if (!response.ok) {
            throw new Error('Could not fetch community journeys.');
        }

        // Converts the server response into JavaScript data.
        const journeys = await response.json();

        // Checks whether the response contains an array.
        if (!Array.isArray(journeys) || journeys.length === 0) {

            // Displays a message when there are no submissions.
            container.innerHTML = `
                <div class="col-12">
                    <p class="community-empty text-center py-3">
                        No community journeys published yet.
                    </p>
                </div>
            `;

            // Stops because there are no cards to display.
            return;

        }

        // Clears the loading message.
        container.innerHTML = '';

        // Gets the three latest submissions and puts the newest first.
        const latestJourneys = journeys.slice(-3).reverse();

        // Loops through the three latest submissions.
        latestJourneys.forEach((item) => {

            // Creates a column for each community card.
            const card = document.createElement('div');

            // Makes the cards responsive.
            card.className = 'col-12 col-md-6 col-lg-4 mb-3';

            // Builds the community journey card.
            card.innerHTML = `
                <div class="card community-card h-100 shadow-sm rounded-4 p-3">

                    <div class="card-body d-flex flex-column justify-content-between p-2">

                        <div>

                            <span class="badge bg-primary mb-2">
                                ${escapeHtml(item.courseStudied || item.course || 'General')}
                            </span>

                            <h5 class="card-title fw-bold mb-1">
                                ${escapeHtml(item.fullName || item.name || 'Anonymous')}
                            </h5>

                            <h6 class="card-subtitle mb-2 text-muted small">
                                🎓 ${escapeHtml(item.university || 'University not specified')}
                            </h6>

                            <p class="card-text small text-secondary mb-3">
                                💼 <strong>${escapeHtml(item.currentRole || item.role || 'Contributor')}</strong>
                                at <strong>${escapeHtml(item.company || 'N/A')}</strong>
                            </p>

                            <div class="mb-2">

                                <span class="fw-bold small text-dark d-block">
                                    Biggest Challenge:
                                </span>

                                <p class="small text-secondary mb-2">
                                    ${escapeHtml(item.biggestChallenge || item.challenge || item.story || 'Not provided')}
                                </p>

                            </div>

                            <div class="mb-2">

                                <span class="fw-bold small text-dark d-block">
                                    Skills Acquired:
                                </span>

                                <p class="small text-primary mb-2">
                                    ${escapeHtml(item.skillsAcquired || item.skills || 'N/A')}
                                </p>

                            </div>

                        </div>

                        <div>

                            <div class="border-top pt-2 mt-2 mb-3">

                                <span class="fw-bold small text-dark d-block">
                                    Best Advice:
                                </span>

                                <p class="card-text text-muted fst-italic small mb-0">
                                    "${escapeHtml(item.bestAdvice || item.advice || 'Not provided')}"
                                </p>

                            </div>

                            <a href="journeys.html" class="btn btn-sm btn-outline-primary w-100 rounded-pill fw-semibold">
                                View Full Story &rarr;
                            </a>

                        </div>

                    </div>

                </div>
            `;

            // Adds the completed card to the page.
            container.appendChild(card);

        });

        // Creates a container for the View All button.
        const viewAllWrapper = document.createElement('div');

        // Makes the button occupy the full row.
        viewAllWrapper.className = 'col-12 text-center mt-3';

        // Adds the View All button.
        viewAllWrapper.innerHTML = `
            <a href="journeys.html" class="btn btn-outline-light rounded-pill px-4 py-2 fw-bold">
                View All Community Journeys &rarr;
            </a>
        `;

        // Adds the button below the community cards.
        container.appendChild(viewAllWrapper);

    } catch (err) {

        // Displays the actual error in the browser console.
        console.error('Failed to load journey previews:', err);

        // Displays a friendly error message on the page.
        container.innerHTML = `
            <div class="col-12">
                <p class="community-empty text-center py-3">
                    Could not connect to the backend server.
                </p>
            </div>
        `;

    }

}


// ============================================
// 7. FALLBACK CAREER STEPS
// ============================================

// Provides basic steps when a route has no steps in courses.json.
function getSmartFallbackSteps(routeName) {

    // Converts the career name to lowercase for easier checking.
    const name = routeName.toLowerCase();

    // Checks whether the career is related to software development.
    if (
        name.includes('software') ||
        name.includes('developer') ||
        name.includes('engineer') ||
        name.includes('frontend') ||
        name.includes('backend')
    ) {

        // Returns sample software development steps.
        return [

            {
                title: 'Learn the Fundamentals',
                type: 'skill',
                duration: '3 - 6 months',
                note: 'Learn programming fundamentals, HTML, CSS, JavaScript, and problem-solving. Practise regularly and understand how websites and applications work.'
            },

            {
                title: 'Learn Version Control',
                type: 'skill',
                duration: '1 - 2 months',
                note: 'Learn Git and GitHub so you can track your code, manage changes, and collaborate with other developers.'
            },

            {
                title: 'Build Practical Projects',
                type: 'project',
                duration: '2 - 3 months',
                note: 'Build small but useful applications. Try to solve real problems and keep your projects in a portfolio.'
            },

            {
                title: 'Seek Internship Opportunities',
                type: 'internship',
                duration: '4 - 6 months',
                note: 'Apply for SIWES placements, internships, or supervised projects where you can work with other developers.'
            },

            {
                title: 'Apply for Entry-Level Roles',
                type: 'job',
                duration: 'After gaining practical experience',
                note: 'Use your projects, practical experience, and professional connections when applying for junior developer positions.'
            }

        ];

    }

    // Checks whether the career is related to data analysis.
    else if (
        name.includes('data') ||
        name.includes('analyst') ||
        name.includes('scientist')
    ) {

        // Returns sample data analysis steps.
        return [

            {
                title: 'Learn Data Fundamentals',
                type: 'skill',
                duration: '3 - 4 months',
                note: 'Learn spreadsheets, basic statistics, and how to organise and interpret data.'
            },

            {
                title: 'Learn Data Tools',
                type: 'skill',
                duration: '2 - 3 months',
                note: 'Practise SQL and Python or another relevant data tool. Learn how to clean, analyse, and organise datasets.'
            },

            {
                title: 'Build Data Projects',
                type: 'project',
                duration: '2 months',
                note: 'Find public datasets, analyse them, and present your findings using clear reports or dashboards.'
            },

            {
                title: 'Seek Practical Experience',
                type: 'internship',
                duration: '4 - 6 months',
                note: 'Look for internships, volunteer projects, or opportunities to work with real datasets.'
            },

            {
                title: 'Apply for Entry-Level Roles',
                type: 'job',
                duration: 'After gaining practical experience',
                note: 'Prepare a portfolio showing your analysis projects and the tools you can use.'
            }

        ];

    }

    // Provides general sample steps for other career paths.
    else {

        // Returns a general career development roadmap.
        return [

            {
                title: 'Understand the Career',
                type: 'skill',
                duration: '1 - 2 months',
                note: `Research the responsibilities, common skills, and qualifications required for a ${routeName}.`
            },

            {
                title: 'Develop Relevant Skills',
                type: 'skill',
                duration: '3 - 6 months',
                note: 'Learn the tools, knowledge, and practical skills commonly used in the field.'
            },

            {
                title: 'Complete Practical Projects',
                type: 'project',
                duration: '2 - 3 months',
                note: 'Look for practical assignments, personal projects, or community activities related to the career.'
            },

            {
                title: 'Seek Internship Opportunities',
                type: 'internship',
                duration: '4 - 6 months',
                note: 'Apply for SIWES placements or internships to gain experience in a professional environment.'
            },

            {
                title: 'Apply for Entry-Level Roles',
                type: 'job',
                duration: 'After gaining practical experience',
                note: 'Prepare your CV, show evidence of your skills, and apply for suitable entry-level opportunities.'
            }

        ];

    }

}


// ============================================
// 8. LOAD THE SELECTED CAREER ROUTE
// ============================================

// Checks whether the important page elements exist.
if (
    !courseLabel ||
    !routeTitle ||
    !routeSummary ||
    !timeline ||
    !skillsBox ||
    !adviceBox ||
    !adviceText ||
    !backLink ||
    !gapLink
) {

    // Displays an error if the HTML elements are missing.
    console.error('One or more required journey page elements were not found.');

} else {

    // Loads the course information from the JSON file.
    fetch('data/courses.json')

        // Handles the response from the JSON file.
        .then((response) => {

            // Checks whether the file was loaded successfully.
            if (!response.ok) {
                throw new Error('Could not load courses.json');
            }

            // Converts the response into JavaScript data.
            return response.json();

        })

        // Uses the loaded course data.
        .then((data) => {

            // Finds the selected course using its ID.
            const course = data.courses.find((c) => c.id === courseId);

            // Finds the selected career route using its index.
            const route = course && routeParam !== null && Number.isInteger(routeIndex) && routeIndex >= 0
                ? course.routes[routeIndex]
                : null;

            // Checks whether the course or career route was found.
            if (!route) {

                // Displays an error heading.
                routeTitle.textContent = 'Journey not found';

                // Explains what the user should do.
                routeSummary.textContent = 'Please return to the course page and select a career route.';

                // Stops because there is no route to display.
                return;

            }


            // ============================================
            // 9. DISPLAY THE COURSE AND ROUTE DETAILS
            // ============================================

            // Updates the back link to return to the selected course routes.
            backLink.href = `routes.html?course=${encodeURIComponent(course.id)}`;

            // Updates the back link text.
            backLink.textContent = `← Back to ${course.name} routes`;

            // Sets the gap assessment page URL.
            gapLink.href = `gapmap.html?course=${encodeURIComponent(course.id)}&route=${routeIndex}`;

            // Displays the course name.
            courseLabel.textContent = course.name;

            // Displays the career route name.
            routeTitle.textContent = route.name;

            // Displays the route description or a basic fallback description.
            routeSummary.textContent = route.summary ||
                `Explore the skills, practical experience, and steps that can help you work towards becoming a ${route.name}.`;


            // ============================================
            // 10. DISPLAY THE GRADUATE PROFILE
            // ============================================

            // Checks whether this route contains graduate information.
            if (route.graduate && profileCard) {

                // Gets the graduate label element.
                const profileLabel = document.getElementById('profileLabel');

                // Gets the graduate role element.
                const profileRole = document.getElementById('profileRole');

                // Gets the graduate organisation element.
                const profileOrg = document.getElementById('profileOrg');

                // Displays the graduate label if the element exists.
                if (profileLabel) {
                    profileLabel.textContent = route.graduate.label || '';
                }

                // Displays the graduate's role if the element exists.
                if (profileRole) {
                    profileRole.textContent = route.graduate.role || '';
                }

                // Displays the graduate's organisation if the element exists.
                if (profileOrg) {
                    profileOrg.textContent = route.graduate.organisation || '';
                }

                // Makes the graduate profile visible.
                profileCard.classList.remove('d-none');

            }


            // ============================================
            // 11. DISPLAY THE TIMELINE
            // ============================================

            // Clears any existing timeline content.
            timeline.innerHTML = '';

            // Uses the route's own steps when available.
            // Otherwise, uses the sample fallback steps.
            const steps = (
                route.steps && route.steps.length > 0
            )
                ? route.steps
                : getSmartFallbackSteps(route.name);

            // Loops through every career step.
            steps.forEach((step, index) => {

                // Creates a container for the current step.
                const item = document.createElement('div');

                // Adds spacing and positioning classes.
                item.className = 'position-relative ps-4 pb-4';

                // Gets the badge style for the current step type.
                const badgeStyle = typeStyles[step.type] || 'text-bg-secondary';

                // Builds the timeline step card.
                item.innerHTML = `

                    <span
                        class="position-absolute start-0 top-0 translate-middle-x mt-4 rounded-circle bg-white border border-3 border-primary"
                        style="width:18px;height:18px;">
                    </span>

                    <div class="rounded-4 p-3 shadow-sm" style="background:#111f38; border:1px solid #263b5c; color:#ffffff;">

                        <div class="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">

                            <span class="badge ${badgeStyle} text-capitalize">
                                ${escapeHtml(step.type || 'experience')}
                            </span>

                            <span class="small" style="color:#b9c9df;">
                                ⏱️ ${escapeHtml(step.duration || 'Duration not specified')}
                            </span>

                        </div>

                        <div class="fw-bold fs-5 mb-2">
                            ${index + 1}. ${escapeHtml(step.title || 'Untitled step')}
                        </div>

                        <div style="color:#cbd5e1;">
                            ${escapeHtml(step.note || '')}
                        </div>

                    </div>

                `;

                // Adds the completed step to the timeline.
                timeline.appendChild(item);

            });


            // ============================================
            // 12. DISPLAY THE CHALLENGES
            // ============================================

            // Checks whether the route has challenges.
            if (
                route.challenges &&
                route.challenges.length > 0 &&
                challengesBox &&
                challengeList
            ) {

                // Clears the existing challenge list.
                challengeList.innerHTML = '';

                // Loops through the challenges.
                route.challenges.forEach((challenge) => {

                    // Creates a new list item.
                    const li = document.createElement('li');

                    // Applies the Bootstrap list item class.
                    li.className = 'list-group-item';

                    // Adds the challenge as plain text.
                    li.textContent = challenge;

                    // Adds the challenge to the list.
                    challengeList.appendChild(li);

                });

                // Makes the challenges section visible.
                challengesBox.classList.remove('d-none');

            } else if (challengesBox) {

                // Hides the section when there are no challenges.
                challengesBox.classList.add('d-none');

            }


            // ============================================
            // 13. DISPLAY THE REQUIRED SKILLS
            // ============================================

            // Clears the existing skills.
            skillsBox.innerHTML = '';

            // Uses the route's skills when available.
            // Otherwise, displays a small general sample list.
            const skills = (
                route.skills && route.skills.length > 0
            )
                ? route.skills
                : [
                    'Communication',
                    'Problem Solving',
                    'Industry Knowledge',
                    'Practical Experience'
                ];

            // Loops through the skills.
            skills.forEach((skill) => {

                // Creates a new badge.
                const badge = document.createElement('span');

                // Applies the skill badge styling.
                badge.className = 'badge rounded-pill fs-6 fw-normal px-3 py-2 me-2 mb-2';

                // Applies the blue theme.
                badge.style.backgroundColor = '#132c4d';

                // Applies the light blue text.
                badge.style.color = '#65d5ff';

                // Adds a subtle border.
                badge.style.border = '1px solid #24517b';

                // Displays the skill name.
                badge.textContent = skill;

                // Adds the badge to the skills container.
                skillsBox.appendChild(badge);

            });


            // ============================================
            // 14. DISPLAY CAREER ADVICE
            // ============================================

            // Checks whether advice exists for this route.
            if (route.advice) {

                // Displays the advice.
                adviceText.textContent = route.advice;

                // Makes the advice card visible.
                adviceBox.classList.remove('d-none');

            } else {

                // Hides the advice card when no advice exists.
                adviceBox.classList.add('d-none');

            }


            // Updates the trace line after the timeline has loaded.
            updateTrace();

        })

        // Handles errors while loading the course data.
        .catch((error) => {

            // Displays the actual error in the browser console.
            console.error('Error loading journey data:', error);

            // Displays an error heading.
            routeTitle.textContent = 'Could not load journey data';

            // Explains where to check for the problem.
            routeSummary.textContent = 'Please check that data/courses.json exists and is correctly formatted.';

        });

}


// ============================================
// 15. START THE COMMUNITY PREVIEW LOADER
// ============================================

// Runs the community loader after the page HTML is ready.
if (document.readyState === 'loading') {

    // Waits for the HTML document to finish loading.
    document.addEventListener('DOMContentLoaded', loadHomeJourneyPreviews);

} else {

    // Runs immediately if the HTML is already loaded.
    loadHomeJourneyPreviews();

}
