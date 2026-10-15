// Router dan tampilan aplikasi.
const app = document.getElementById('app');

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const findCourse = (id) => COURSES.find((c) => c.id === id);

function updateStats() {
  document.getElementById('stat-level').textContent = `Lv ${Store.level()}`;
  document.getElementById('stat-xp').textContent = `${Store.xp()} XP`;
}

function progressBar({ done, total }, color) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
<small>${done}/${total} pelajaran · ${pct}%</small>`;
}

// ---------- Beranda ----------
function renderHome() {
  app.innerHTML = `
<section class="hero">
  <h1>Belajar koding langsung di browser</h1>
  <p>Baca materi singkat, tulis kode, lihat hasilnya, dan dapatkan XP.</p>
</section>
<section class="grid">
  ${COURSES.map((c) => `
  <a class="card" href="#/course/${c.id}" style="--accent:${c.color}">
    <div class="card-icon">${c.icon}</div>
    <h2>${c.title}</h2>
    <p>${c.description}</p>
    ${progressBar(Store.courseProgress(c), c.color)}
  </a>`).join('')}
</section>
<p class="center"><button class="btn-link" id="reset">Reset semua progres</button></p>`;

  document.getElementById('reset').onclick = () => {
    if (confirm('Hapus semua progres dan kode tersimpan?')) {
      Store.reset();
      updateStats();
      renderHome();
    }
  };
}

// ---------- Daftar pelajaran ----------
function renderCourse(courseId) {
  const course = findCourse(courseId);
  if (!course) return renderNotFound();

  app.innerHTML = `
<a href="#/" class="back">← Semua kursus</a>
<section class="course-head" style="--accent:${course.color}">
  <div class="card-icon">${course.icon}</div>
  <div>
    <h1>${course.title}</h1>
    <p>${course.description}</p>
    ${progressBar(Store.courseProgress(course), course.color)}
  </div>
</section>
<ol class="lesson-list">
  ${course.lessons.map((l, i) => {
    const done = Store.isCompleted(course.id, i);
    return `<li class="${done ? 'done' : ''}">
      <a href="#/lesson/${course.id}/${i}">
        <span class="num">${done ? '✓' : i + 1}</span>
        <span>${l.title}</span>
      </a>
    </li>`;
  }).join('')}
</ol>`;
}

// ---------- Pelajaran: slide ----------
function renderLesson(courseId, idx) {
  const course = findCourse(courseId);
  const lesson = course?.lessons[idx];
  if (!lesson) return renderNotFound();

  let slide = 0;
  const draw = () => {
    const s = lesson.slides[slide];
    const last = slide === lesson.slides.length - 1;
    app.innerHTML = `
<a href="#/course/${course.id}" class="back">← ${course.title}</a>
<section class="slide">
  <div class="slide-meta">${lesson.title} · Slide ${slide + 1}/${lesson.slides.length}</div>
  <h2>${s.title}</h2>
  <div class="slide-body">${s.body}</div>
  <div class="slide-nav">
    <button class="btn secondary" id="prev" ${slide === 0 ? 'disabled' : ''}>Sebelumnya</button>
    <button class="btn" id="next">${last ? 'Mulai Latihan →' : 'Berikutnya'}</button>
  </div>
</section>`;
    document.getElementById('prev').onclick = () => { slide--; draw(); };
    document.getElementById('next').onclick = () => {
      if (last) renderExercise(course, idx);
      else { slide++; draw(); }
    };
  };
  draw();
}

// ---------- Pelajaran: latihan ----------
function renderExercise(course, idx) {
  const lesson = course.lessons[idx];
  const ex = lesson.exercise;
  const saved = Store.getCode(course.id, idx);
  const files = ex.files.map((f) => ({ name: f.name, content: saved?.[f.name] ?? f.content }));
  const isJs = files.every((f) => f.name.endsWith('.js'));
  let active = files.length > 1 ? files.length - 1 : 0; // buka file yang perlu diedit
  let hintShown = 0;

  app.innerHTML = `
<div class="ex-top">
  <a href="#/course/${course.id}" class="back">← ${course.title}</a>
  <strong>${lesson.title}</strong>
</div>
<div class="workspace">
  <aside class="panel instructions">
    <h3>Instruksi</h3>
    <div>${ex.instruction}</div>
    <h4>Kriteria</h4>
    <ul id="checks">${ex.checks.map((c) => `<li>${escapeHtml(c.desc)}</li>`).join('')}</ul>
    <div id="hints"></div>
    <div class="btn-row">
      <button class="btn secondary small" id="hint">Petunjuk</button>
      <button class="btn secondary small" id="solution">Lihat Jawaban</button>
      <button class="btn secondary small" id="reset-code">Reset Kode</button>
    </div>
  </aside>
  <section class="panel editor">
    <div class="tabs" id="tabs"></div>
    <textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
    <div class="editor-actions">
      <button class="btn secondary" id="run">▶ Jalankan</button>
      <button class="btn" id="check">Cek Jawaban</button>
    </div>
  </section>
  <section class="panel output">
    <div class="tabs"><span class="tab active">${isJs ? 'Konsol' : 'Pratinjau'}</span></div>
    <iframe id="preview" title="Pratinjau" class="${isJs ? 'hidden' : ''}"></iframe>
    <pre id="console" class="console ${isJs ? '' : 'mini'}"></pre>
  </section>
</div>
<div id="modal"></div>`;

  const editor = document.getElementById('code');
  const tabs = document.getElementById('tabs');
  const iframe = document.getElementById('preview');
  const consoleEl = document.getElementById('console');

  const drawTabs = () => {
    tabs.innerHTML = files.map((f, i) => `<button class="tab ${i === active ? 'active' : ''}" data-i="${i}">${f.name}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { active = Number(b.dataset.i); drawTabs(); editor.value = files[active].content; };
    });
  };
  drawTabs();
  editor.value = files[active].content;

  const persist = () => Store.setCode(course.id, idx, Object.fromEntries(files.map((f) => [f.name, f.content])));

  editor.addEventListener('input', () => { files[active].content = editor.value; persist(); });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = editor;
      editor.setRangeText('  ', s, end, 'end');
      files[active].content = editor.value;
      persist();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      check();
    }
  });

  const run = async () => {
    consoleEl.textContent = '';
    return Runner.run(iframe, files, (line) => { consoleEl.textContent += line + '\n'; });
  };

  const check = async () => {
    const ctx = await run();
    const results = Runner.check(ex, ctx, files);
    document.getElementById('checks').innerHTML = results
      .map((r) => `<li class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${escapeHtml(r.desc)}</li>`).join('');
    if (results.every((r) => r.pass)) {
      const firstTime = !Store.isCompleted(course.id, idx);
      Store.complete(course.id, idx);
      updateStats();
      showSuccess(course, idx, firstTime);
    }
  };

  document.getElementById('run').onclick = run;
  document.getElementById('check').onclick = check;
  document.getElementById('hint').onclick = () => {
    if (hintShown < ex.hints.length) hintShown++;
    document.getElementById('hints').innerHTML = ex.hints.slice(0, hintShown)
      .map((h) => `<div class="hint">💡 <code>${escapeHtml(h)}</code></div>`).join('');
  };
  document.getElementById('solution').onclick = () => {
    if (!confirm('Tampilkan jawaban? Kode kamu akan diganti.')) return;
    files.forEach((f) => { if (ex.solution[f.name] != null) f.content = ex.solution[f.name]; });
    editor.value = files[active].content;
    persist();
    run();
  };
  document.getElementById('reset-code').onclick = () => {
    if (!confirm('Kembalikan kode ke awal?')) return;
    ex.files.forEach((f, i) => { files[i].content = f.content; });
    editor.value = files[active].content;
    Store.clearCode(course.id, idx);
    run();
  };

  run();
  editor.focus();
}

function showSuccess(course, idx, firstTime) {
  const hasNext = idx + 1 < course.lessons.length;
  const modal = document.getElementById('modal');
  modal.innerHTML = `
<div class="modal-backdrop">
  <div class="modal">
    <div class="big">🎉</div>
    <h2>Latihan selesai!</h2>
    <p>${firstTime ? '+50 XP' : 'Sudah pernah diselesaikan'}</p>
    <div class="btn-row center">
      <button class="btn secondary" id="stay">Tetap di sini</button>
      ${hasNext
        ? `<a class="btn" href="#/lesson/${course.id}/${idx + 1}">Pelajaran berikutnya →</a>`
        : `<a class="btn" href="#/course/${course.id}">Kembali ke kursus</a>`}
    </div>
  </div>
</div>`;
  document.getElementById('stay').onclick = () => { modal.innerHTML = ''; };
}

function renderNotFound() {
  app.innerHTML = `<section class="hero"><h1>Halaman tidak ditemukan</h1><p><a href="#/">Kembali ke beranda</a></p></section>`;
}

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  window.scrollTo(0, 0);
  if (parts.length === 0) renderHome();
  else if (parts[0] === 'course' && parts[1]) renderCourse(parts[1]);
  else if (parts[0] === 'lesson' && parts[1] && parts[2] != null) renderLesson(parts[1], Number(parts[2]));
  else renderNotFound();
}

window.addEventListener('hashchange', route);
updateStats();
route();
