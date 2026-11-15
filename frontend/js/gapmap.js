// the area where the question groups will go
const questionBox = document.getElementById('questionBox');
// the career name label
const routeLabel = document.getElementById('routeLabel');
// the back link at the top
const backLink = document.getElementById('backLink');
// the percentage number in the sticky progress bar
const percentEl = document.getElementById('percent');
// the sticky progress bar itself
const bar = document.getElementById('bar');
// the whole result card
const resultBox = document.getElementById('resultBox');
// the level name in the result card
const levelName = document.getElementById('levelName');
// the sentence under the level name
const levelText = document.getElementById('levelText');
// the line that says what the result is measured against
const basis = document.getElementById('basis');
// the area that shows one bar per yardstick
const yardsticks = document.getElementById('yardsticks');
// the list of things the student still needs
const needList = document.getElementById('needList');
// the list that shows the progress log
const logList = document.getElementById('logList');

// read the URL values (for example course=cs&route=0)
const params = new URLSearchParams(window.location.search);
// the course id from the URL
const courseId = params.get('course');
// the route position from the URL, as a number
const routeIndex = Number(params.get('route'));

// every question on the route, in one flat list (each knows its group name)
let items = [];
// the groups (yardsticks) of questions, each with a category name and its items
let groups = [];
// the ids of the things the student has ticked
let done = new Set();
// the progress log, newest entry first
let log = [];
// the browser storage name for this route's ticks
const checkKey = `traceng-check-${courseId}-${routeIndex}`;
// the browser storage name for this route's log
const logKey = `traceng-log-${courseId}-${routeIndex}`;

// function that reads a saved value from the browser, or returns a fallback
function readStore(key, fallback) {
  // storage can be blocked (private windows), so wrap it in try/catch
  try {
    // read the saved text
    const raw = localStorage.getItem(key);
    // turn it back into data, or use the fallback if nothing is saved
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    // if reading fails, use the fallback
    return fallback;
  }
}

// function that saves a value in the browser
function writeStore(key, value) {
  // storage can be blocked, so wrap it in try/catch
  try {
    // save the value as text
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // if saving fails, carry on without saving
  }
}

// function that returns today's date as readable text
function today() {
  // format it like "5 Nov 2026"
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// function that works out points earned, points possible and a percentage for a list of questions
function score(list) {
  // add up the points available in this list
  const total = list.reduce((sum, it) => sum + it.weight, 0);
  // add up the points the student has earned from ticked items
  const got = list.filter(it => done.has(it.id)).reduce((sum, it) => sum + it.weight, 0);
  // turn it into a whole-number percentage (0 if there are no points)
  return { total, got, percent: total ? Math.round((got / total) * 100) : 0 };
}

// function that turns an overall percentage into a level name and a sentence
function levelFor(percent) {
  // under 20%: just starting
  if (percent < 20) return { name: 'Just starting', text: 'You are at the beginning of this route. Start with the foundations below.' };
  // 20 to 44%: building foundations
  if (percent < 45) return { name: 'Building foundations', text: 'You have made a start. Strengthen your skills and begin building projects.' };
  // 45 to 74%: getting job-ready
  if (percent < 75) return { name: 'Getting job-ready', text: 'You are well on your way. Real experience and projects will move you forward fastest.' };
  // 75% and above: job-ready
  return { name: 'Job-ready', text: 'You match most of what the recorded journeys show. Time to apply and keep sharpening your skills.' };
}

// function that draws the progress log
function renderLog() {
  // do nothing if the log area is not on the page
  if (!logList) return;
  // clear the old entries
  logList.innerHTML = '';
  // if nothing has been logged yet, show a hint
  if (log.length === 0) {
    // create the hint line
    const hint = document.createElement('li');
    // write the hint text
    hint.textContent = 'Nothing logged yet. Tick something you have done to start your log.';
    // add it to the list
    logList.appendChild(hint);
    // stop here
    return;
  }
  // go through each log entry
  log.forEach(entry => {
    // create a list item
    const li = document.createElement('li');
    // spacing between entries
    li.className = 'mb-1';
    // show the date and what happened
    li.textContent = `${entry.date} · ${entry.text}`;
    // add it to the list
    logList.appendChild(li);
  });
}

// function that adds an entry to the top of the log and saves it
function addLog(text) {
  // put the new entry first and keep only the latest 40
  log = [{ date: today(), text }, ...log].slice(0, 40);
  // save the log in the browser
  writeStore(logKey, log);
  // redraw the log
  renderLog();
}

// function that recalculates everything and updates the progress bar and the result card
function renderResult() {
  // score the whole route
  const overall = score(items);
  // show the percentage next to the sticky bar
  percentEl.textContent = `${overall.percent}%`;
  // grow the bar to match
  bar.style.width = `${overall.percent}%`;
  // work out the level for this percentage
  const level = levelFor(overall.percent);
  // show the level name
  levelName.textContent = level.name;
  // show the level sentence
  levelText.textContent = level.text;

  // clear the yardstick bars
  yardsticks.innerHTML = '';
  // go through each group (each group is one yardstick)
  groups.forEach(g => {
    // score just this group
    const s = score(g.items);
    // create a block for this yardstick
    const block = document.createElement('div');
    // spacing between yardsticks
    block.className = 'mb-3';
    // fill it with the name, the points, and a small progress bar
    block.innerHTML = `
      <div class="d-flex justify-content-between small mb-1"><span class="fw-semibold">${g.category}</span><span>${s.got} of ${s.total} points</span></div>
      <div class="progress" style="height:8px;"><div class="progress-bar" style="width:${s.percent}%"></div></div>`;
    // add it to the result card
    yardsticks.appendChild(block);
  });

  // clear the "still need" list
  needList.innerHTML = '';
  // collect the items not ticked yet, biggest points first (the sort keeps the original order for ties)
  const missing = items.filter(it => !done.has(it.id)).sort((a, b) => b.weight - a.weight).slice(0, 6);
  // if nothing is missing, say so
  if (missing.length === 0) {
    // create the message line
    const none = document.createElement('li');
    // write the message
    none.textContent = 'Nothing left on this list. Time to apply.';
    // add it to the list
    needList.appendChild(none);
  }
  // go through each missing item
  missing.forEach(it => {
    // create a list item
    const li = document.createElement('li');
    // spacing between items
    li.className = 'mb-2';
    // build the learning link only when this item has one; it opens in a new tab
    const learnLink = it.learn ? `<div><a href="${it.learn.url}" target="_blank" rel="noopener" class="small text-primary">Learn this: ${it.learn.title} &#8599;</a></div>` : '';
    // show what is missing, how many points it is worth, and the learning link
    li.innerHTML = `<div class="fw-semibold">${it.label} <span class="small text-secondary fw-normal">(worth ${it.weight} ${it.weight === 1 ? 'point' : 'points'})</span></div>${learnLink}`;
    // add it to the list
    needList.appendChild(li);
  });
}

// load the courses file
fetch('data/courses.json')
  // turn the response into usable JSON
  .then(res => res.json())
  // once we have the data
  .then(data => {
    // find the course that matches the URL
    const course = data.courses.find(c => c.id === courseId);
    // pick the route by its position, if the course exists
    const route = course ? course.routes[routeIndex] : null;
    // point the back link at the journey page when the route exists
    if (route) {
      // set the link target
      backLink.href = `journey.html?course=${course.id}&route=${routeIndex}`;
      // say where the link goes
      backLink.innerHTML = `&larr; Back to the ${route.name} journey`;
      // show the career name above the heading
      routeLabel.textContent = route.name;
    }
    // keep only well-formed groups (a category name and a list of items)
    groups = route && Array.isArray(route.checklist)
      // keep groups that have a category and an items list
      ? route.checklist.filter(g => g && g.category && Array.isArray(g.items)).map(g => ({
        // keep the category name
        category: g.category,
        // keep items that have an id and a label, and give each a numeric weight (default 1)
        items: g.items.filter(it => it && it.id && it.label).map(it => ({ id: String(it.id), label: it.label, weight: Number(it.weight) || 1, learn: it.learn || null, category: g.category }))
      }))
      // no checklist on this route yet
      : [];
    // flatten all groups into one list of items
    items = groups.flatMap(g => g.items);
    // if the route has no questions yet, say so and hide the result card
    if (items.length === 0) {
      // friendly message
      questionBox.innerHTML = '<p class="text-white-50">Questions for this route are still being collected.</p>';
      // hide the result card because there is nothing to measure
      resultBox.classList.add('d-none');
      // stop here
      return;
    }
    // load the saved ticks
    const saved = readStore(checkKey, []);
    // keep only ids that still exist in the checklist
    done = new Set(Array.isArray(saved) ? saved.filter(id => items.some(it => it.id === id)) : []);
    // load the saved log
    const savedLog = readStore(logKey, []);
    // only keep entries that have a date and text
    log = Array.isArray(savedLog) ? savedLog.filter(e => e && typeof e.date === 'string' && typeof e.text === 'string') : [];
    // say what the result is measured against
    basis.textContent = `Measured against the ${route.journeys || 0} recorded journeys on this route${data.sample ? ' (sample data for now)' : ''}.`;
    // draw each group of questions
    groups.forEach(g => {
      // create a wrapper for this group
      const section = document.createElement('div');
      // spacing between groups
      section.className = 'mb-4';
      // start the group with its heading
      section.innerHTML = `<h3 class="h5 fw-bold mb-3">${g.category}</h3>`;
      // go through each question in the group
      g.items.forEach(it => {
        // create a clickable row so tapping anywhere ticks the box
        const row = document.createElement('label');
        // white card with the checkbox on the left
        row.className = 'bg-white text-dark rounded-4 p-3 mb-2 d-flex gap-3 align-items-start';
        // fill the row with a clearly visible checkbox and the question text
        row.innerHTML = `<input type="checkbox" class="form-check-input border border-2 border-primary mt-1" data-id="${it.id}" ${done.has(it.id) ? 'checked' : ''}><div>${it.label}</div>`;
        // add the row to the group
        section.appendChild(row);
      });
      // add the group to the page
      questionBox.appendChild(section);
    });
    // show the saved state in the progress bar, the result card and the log
    renderResult();
    // show the log
    renderLog();
  })
  // if loading fails, show a message instead of a blank page
  .catch(() => {
    // tell the user something went wrong
    questionBox.textContent = 'Could not load data. Run the page with Live Server.';
  });

// listen for any checkbox being ticked or unticked
questionBox.addEventListener('change', e => {
  // read which question was changed
  const id = e.target.dataset.id;
  // find that question in the list
  const item = items.find(it => it.id === id);
  // ignore changes that did not come from a question checkbox
  if (!item) return;
  // add or remove it from the ticked set
  if (e.target.checked) done.add(id); else done.delete(id);
  // save the ticks in the browser
  writeStore(checkKey, [...done]);
  // log what happened
  addLog(`${e.target.checked ? 'Ticked' : 'Unticked'}: ${item.label}`);
  // refresh the progress bar and the result
  renderResult();
});