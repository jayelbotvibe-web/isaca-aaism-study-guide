(function () {
  'use strict';
  var pages = Array.from(document.querySelectorAll('article.page'));
  var shell = document.querySelector('.shell');
  var toc = document.querySelector('nav.toc');
  toc.id = 'book-toc';
  var mobileContents = document.createElement('button');
  mobileContents.type = 'button'; mobileContents.className = 'mobile-toc-toggle';
  mobileContents.setAttribute('aria-controls', 'book-toc'); mobileContents.setAttribute('aria-expanded', 'false');
  mobileContents.textContent = 'Contents'; toc.before(mobileContents);
  function setContents(open) { shell.classList.toggle('toc-open', open); mobileContents.setAttribute('aria-expanded', String(open)); }
  mobileContents.addEventListener('click', function () { setContents(!shell.classList.contains('toc-open')); });
  var links = Array.from(document.querySelectorAll('nav.toc a'));
  var pageOf = {};
  pages.forEach(function (page, i) {
    page.querySelectorAll('[id]').forEach(function (el) { pageOf[el.id] = i; });
  });
  var positionKey = 'aaism-book:v2:pos';
  var practiceKey = 'aaism-book:v3:practice';
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  var saved = read(positionKey) || read('aaism-book:v1:pos');
  var idx = saved && saved.id in pageOf ? pageOf[saved.id] : 0;
  var flow = !!(saved && saved.flow);
  var restoring = true;
  var timer;
  function pageId(i) { return pages[i].querySelector('section.ch').id; }
  function savePosition() {
    if (restoring) return;
    if (flow) {
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].getBoundingClientRect().top <= 90) idx = i;
      }
    }
    write(positionKey, { id: pageId(idx), offset: Math.round(Math.max(0, -pages[idx].getBoundingClientRect().top)), flow: flow });
  }
  function render() {
    pages.forEach(function (p, i) { p.classList.toggle('on', i === idx); });
    shell.classList.toggle('flow', flow);
    document.getElementById('prevBtn').disabled = idx === 0;
    document.getElementById('nextBtn').disabled = idx === pages.length - 1;
    document.getElementById('pLabel').textContent = pages[idx].dataset.label;
    document.getElementById('pCount').textContent = 'Section ' + (idx + 1) + ' of ' + pages.length;
    document.getElementById('bar').style.width = ((idx + 1) / pages.length * 100) + '%';
    links.forEach(function (a) {
      var active = a.hash === '#' + pageId(idx);
      a.classList.toggle('here', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    ['mPage', 'mFlow'].forEach(function (id, i) {
      var on = i === 1 ? flow : !flow;
      var b = document.getElementById(id); b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
  }
  function navigate(id, updateHash, focus) {
    if (!(id in pageOf)) return;
    idx = pageOf[id];
    var target = document.getElementById(id);
    if (target.classList.contains('practice-question')) showPracticeQuestion(target);
    if (focus && window.matchMedia('(max-width:1000px)').matches) setContents(false);
    render();
    if (updateHash && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (focus) {
      var destination = target.matches('section') ? target.querySelector('h3') : target;
      destination.setAttribute('tabindex', '-1'); destination.focus({ preventScroll: true });
    }
    savePosition();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var id = a.getAttribute('href').slice(1);
    if (id in pageOf) { e.preventDefault(); navigate(id, true, true); }
  });
  window.addEventListener('hashchange', function () { navigate(location.hash.slice(1), false, false); });
  document.getElementById('prevBtn').addEventListener('click', function () { if (idx > 0) navigate(pageId(idx - 1), true, true); });
  document.getElementById('nextBtn').addEventListener('click', function () { if (idx < pages.length - 1) navigate(pageId(idx + 1), true, true); });
  document.getElementById('mPage').addEventListener('click', function () { savePosition(); flow = false; render(); navigate(pageId(idx), false, false); });
  document.getElementById('mFlow').addEventListener('click', function () { flow = true; render(); navigate(pageId(idx), false, false); });
  window.addEventListener('scroll', function () { clearTimeout(timer); timer = setTimeout(savePosition, 200); }, { passive: true });
  window.addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', function () { if (document.hidden) savePosition(); });

  // Accessible figures: native buttons, modal labelling, focus containment and return.
  var modal = document.createElement('div');
  modal.id = 'lb'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lbCap'); modal.tabIndex = -1;
  modal.innerHTML = '<div id="lbBar"><span id="lbCap"></span><button class="lbb" id="lbFit" type="button">Fit width</button><button class="lbb" id="lbBig" type="button">Larger</button><button class="lbb" id="lbX" type="button">Close</button></div><div id="lbInner"></div>';
  document.body.appendChild(modal);
  var returnFocus;
  function closeFigure() {
    modal.classList.remove('on', 'big'); document.body.style.overflow = '';
    document.querySelectorAll('[data-modal-inert]').forEach(function (el) { el.inert = false; el.removeAttribute('data-modal-inert'); });
    document.getElementById('lbInner').replaceChildren();
    if (returnFocus) returnFocus.focus();
  }
  document.querySelectorAll('figure').forEach(function (fig, i) {
    var button = document.createElement('button'); button.type = 'button'; button.className = 'figure-open';
    button.textContent = 'Enlarge Figure ' + (i + 1); button.setAttribute('aria-haspopup', 'dialog'); fig.appendChild(button);
    fig.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (fig.classList.contains('study-visual') && !e.target.closest('.figure-open')) return;
      returnFocus = button;
      document.getElementById('lbCap').textContent = fig.querySelector('figcaption').textContent;
      var svg = fig.querySelector('svg').cloneNode(true);
      // A cloned SVG must not introduce duplicate IDs into the live document.
      var renames = {};
      svg.querySelectorAll('[id]').forEach(function (el) { var old = el.id; renames[old] = 'zoom-' + old; el.id = renames[old]; });
      [svg].concat(Array.from(svg.querySelectorAll('*'))).forEach(function (el) {
        Array.from(el.attributes).forEach(function (a) {
          var val = a.value;
          if (a.name === 'aria-labelledby' || a.name === 'aria-describedby') {
            val = val.split(/\s+/).map(function (id) { return renames[id] || id; }).join(' ');
          }
          Object.keys(renames).forEach(function (old) { val = val.split('url(#' + old + ')').join('url(#' + renames[old] + ')'); if (val === '#' + old) val = '#' + renames[old]; });
          if (val !== a.value) el.setAttribute(a.name, val);
        });
      });
      document.getElementById('lbInner').replaceChildren(svg);
      modal.classList.add('on'); modal.scrollTop = 0; document.body.style.overflow = 'hidden';
      Array.from(document.body.children).forEach(function (el) { if (el !== modal && !el.inert && el.tagName !== 'SCRIPT') { el.inert = true; el.setAttribute('data-modal-inert', ''); } });
      document.getElementById('lbX').focus();
    });
  });
  document.getElementById('lbX').addEventListener('click', closeFigure);
  document.getElementById('lbFit').addEventListener('click', function () { modal.classList.remove('big'); });
  document.getElementById('lbBig').addEventListener('click', function () { modal.classList.add('big'); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeFigure(); });
  document.addEventListener('keydown', function (e) {
    if (modal.classList.contains('on')) {
      if (e.key === 'Escape') { e.preventDefault(); closeFigure(); }
      if (e.key === 'Tab') {
        var buttons = Array.from(modal.querySelectorAll('button'));
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    // Arrow shortcuts must not interfere with choices, selects, buttons or disclosure controls.
    if (flow || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.target.closest('input,textarea,select,button,summary,a,.visual-viewport,[contenteditable="true"]')) return;
    if (e.key === 'ArrowRight' && idx < pages.length - 1) navigate(pageId(idx + 1), true, true);
    if (e.key === 'ArrowLeft' && idx > 0) navigate(pageId(idx - 1), true, true);
  });

  // Independent answer selection, study filters, timed mode and per-topic feedback.
  var allQuestions = Array.from(document.querySelectorAll('.practice-question'));
  var scope = document.getElementById('practice-scope');
  var stored = read(practiceKey);
  var state = stored && stored.version === 3 ? stored : { version: 3, choices: {}, scope: 'all', deadline: null };
  if (!state.choices || typeof state.choices !== 'object') state.choices = {};
  if (!['all','diagnostic','1','2','3'].includes(state.scope)) state.scope = 'all';
  if (!Number.isFinite(state.deadline) || state.deadline <= 0) state.deadline = null;
  var status = document.getElementById('practice-status');
  var results = document.getElementById('practice-results');
  var liveTimed = false;
  function activeQuestions() { return allQuestions.filter(function (q) { return !q.hidden; }); }
  function persistPractice() { write(practiceKey, state); }
  function filterQuestions() {
    scope.value = state.scope;
    allQuestions.forEach(function (q) { q.hidden = state.scope === 'diagnostic' ? q.dataset.diagnostic !== 'true' : state.scope !== 'all' && q.dataset.domain !== state.scope; });
    results.replaceChildren(); updateStatus(); persistPractice();
  }
  function showPracticeQuestion(q) {
    if (q.hidden) { state.scope = 'all'; filterQuestions(); }
  }
  function updateStatus() {
    var list = activeQuestions();
    var selected = list.filter(function (q) { return Number.isInteger(state.choices[q.id]); }).length;
    status.textContent = selected + ' of ' + list.length + ' visible questions answered. ' + (liveTimed ? 'Solutions unlock when you finish or the timer ends.' : 'Record your reasoning before revealing an answer.');
  }
  function score() {
    var list = activeQuestions(); var groups = {}; var correct = 0, selected = 0;
    list.forEach(function (q) {
      var choice = state.choices[q.id]; var answered = Number.isInteger(choice);
      var ok = answered && choice === Number(q.dataset.answer);
      if (answered) selected++; if (ok) correct++;
      var group = groups[q.dataset.topic] || (groups[q.dataset.topic] = { total: 0, answered: 0, correct: 0 });
      group.total++; if (answered) group.answered++; if (ok) group.correct++;
    });
    results.replaceChildren();
    var p = document.createElement('p');
    p.textContent = correct + ' correct of ' + list.length + ' questions; ' + (list.length - selected) + ' unanswered. ' + Math.round(correct / list.length * 100) + '% on this practice selection. This is not an exam pass prediction.';
    results.appendChild(p);
    var ul = document.createElement('ul');
    Object.keys(groups).sort().forEach(function (topic) { var g = groups[topic]; var li = document.createElement('li'); li.textContent = topic + ': ' + g.correct + '/' + g.total + ' correct; ' + g.answered + ' answered. Review the mapped chapter and explain a changed scenario.'; ul.appendChild(li); });
    results.appendChild(ul);
  }
  function setTimed(enabled) {
    liveTimed = enabled;
    scope.disabled = enabled;
    allQuestions.forEach(function (q) { var d = q.querySelector('details'); if (enabled) d.open = false; d.querySelector('summary').setAttribute('aria-disabled', String(enabled)); });
    updateStatus();
  }
  function finishTimed() {
    state.deadline = null; setTimed(false); persistPractice(); score();
    document.getElementById('practice-timer').textContent = 'Timed run finished. Review omitted items and explanations.';
  }
  function clock() {
    if (!state.deadline) return;
    var seconds = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    document.getElementById('practice-timer').textContent = 'Time remaining: ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    if (seconds === 0) finishTimed();
  }
  allQuestions.forEach(function (q) {
    var savedChoice = state.choices[q.id];
    if (Number.isInteger(savedChoice) && savedChoice >= 0 && savedChoice < 4) q.querySelector('input[value="' + savedChoice + '"]').checked = true;
    else delete state.choices[q.id];
    q.addEventListener('change', function (e) { if (e.target.matches('input[type="radio"]')) { state.choices[q.id] = Number(e.target.value); results.replaceChildren(); persistPractice(); updateStatus(); } });
    q.querySelector('summary').addEventListener('click', function (e) { if (liveTimed) { e.preventDefault(); status.textContent = 'Finish the timed run before opening solutions.'; } });
  });
  scope.addEventListener('change', function () { state.scope = scope.value; filterQuestions(); });
  document.getElementById('practice-grade').addEventListener('click', function () {
    if (liveTimed) { if (!confirm('Finish this timed run and review your answers?')) return; finishTimed(); } else score();
  });
  document.getElementById('practice-timed').addEventListener('click', function () {
    if (!confirm('Start a new 150-minute run? This clears existing practice choices.')) return;
    state.choices = {}; state.scope = 'all'; state.deadline = Date.now() + 150 * 60 * 1000;
    allQuestions.forEach(function (q) { q.querySelectorAll('input').forEach(function (i) { i.checked = false; }); });
    filterQuestions(); setTimed(true); persistPractice(); clock(); navigate('c21', true, false);
  });
  document.getElementById('practice-reset').addEventListener('click', function () {
    if (!confirm('Clear practice choices, feedback and timer? Your reading position stays.')) return;
    state = { version: 3, choices: {}, scope: 'all', deadline: null }; setTimed(false);
    allQuestions.forEach(function (q) { q.querySelectorAll('input').forEach(function (i) { i.checked = false; }); q.querySelector('details').open = false; });
    document.getElementById('practice-timer').textContent = ''; filterQuestions();
  });
  document.getElementById('practice-export').addEventListener('click', function () {
    var record = { edition: '3.0', exportedAt: new Date().toISOString(), choices: state.choices, scope: state.scope, note: 'Author-created practice evidence; add your reasoning and delayed-recall dates.' };
    var url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
    var a = document.createElement('a'); a.href = url; a.download = 'aaism-learning-record.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  document.getElementById('practice-print').addEventListener('click', function () { document.body.classList.add('print-questions'); window.print(); });
  var printDetails = [];
  window.addEventListener('beforeprint', function () {
    printDetails = Array.from(document.querySelectorAll('details.answer-guide, details.practice-solution')).map(function (d) { return [d, d.open]; });
    if (!document.body.classList.contains('print-questions')) printDetails.forEach(function (entry) { entry[0].open = true; });
  });
  window.addEventListener('afterprint', function () {
    printDetails.forEach(function (entry) { entry[0].open = entry[1]; }); printDetails = [];
    document.body.classList.remove('print-questions');
  });
  filterQuestions();
  if (state.deadline) { setTimed(true); clock(); }
  setInterval(clock, 1000);

  // Restore by stable section ID and local offset, not an edition-dependent page index.
  shell.classList.add('reader-ready');
  render();
  var start = location.hash.slice(1);
  if (start in pageOf) navigate(start, false, false);
  else if (saved) {
    render();
    var offset = Number.isFinite(saved.offset) ? saved.offset : 0;
    window.scrollTo({ top: Math.max(0, pages[idx].getBoundingClientRect().top + window.scrollY + offset), behavior: 'instant' });
    var notice = document.createElement('div'); notice.id = 'resume'; notice.className = 'on'; notice.setAttribute('role', 'status');
    var label = document.createElement('b'); label.textContent = 'Resumed: ' + pages[idx].dataset.label;
    var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'rbtn'; reset.textContent = 'Start over';
    reset.addEventListener('click', function () { flow = false; navigate(pageId(0), true, true); notice.remove(); });
    var dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'rbtn'; dismiss.textContent = 'Dismiss'; dismiss.addEventListener('click', function () { notice.remove(); });
    notice.append(label, reset, dismiss); document.body.appendChild(notice);
    setTimeout(function () { notice.remove(); }, 12000);
  }
  restoring = false;
})();
