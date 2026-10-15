// Router dan tampilan aplikasi.
const app = document.getElementById('app');

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const findCourse = (id) => COURSES.find((c) => c.id === id);

function updateStats() {
  document.getElementById('stats').textContent = `Lv ${Store.level()} · ${Store.xp()} XP`;
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
${continueCard()}
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

function continueCard() {
  const next = Store.nextLesson();
  const stage = ROADMAP.find((st) => st.items.some((it) => !Store.isRoadmapDone(it)));
  return `<section class="continue">
  ${next
    ? `<a class="continue-main" href="#/lesson/${next.course.id}/${next.idx}" style="--accent:${next.course.color}">
        <small>Lanjutkan belajar</small>
        <strong>${next.course.icon} ${next.course.title} · ${next.course.lessons[next.idx].title}</strong>
      </a>`
    : `<div class="continue-main"><small>Semua kursus selesai 🎉</small><strong>Lanjutkan proyek di roadmap</strong></div>`}
  <a class="continue-side" href="#/roadmap">
    <small>Tahap roadmap</small>
    <strong>${stage ? `${ROADMAP.indexOf(stage)}. ${stage.title}` : 'Selesai'}</strong>
  </a>
</section>`;
}

// ---------- Roadmap ----------
function renderRoadmap() {
  const allItems = ROADMAP.flatMap((st) => st.items);
  const doneCount = allItems.filter((it) => Store.isRoadmapDone(it)).length;
  const current = ROADMAP.find((st) => st.items.some((it) => !Store.isRoadmapDone(it)));

  app.innerHTML = `
<section class="roadmap-head">
  <h1>Roadmap Web Developer</h1>
  <p>Disusun untuk belajar mandiri dari HP. Setiap tahap diakhiri satu proyek kecil, jangan tunggu semua teori selesai.</p>
  ${progressBar({ done: doneCount, total: allItems.length }, 'var(--primary)').replace('pelajaran', 'kemampuan')}
  <p class="note">Durasi adalah perkiraan kasar untuk 1–2 jam belajar per hari.</p>
</section>
<div class="stages">
  ${ROADMAP.map((st, n) => {
    const done = st.items.filter((it) => Store.isRoadmapDone(it)).length;
    const complete = done === st.items.length;
    return `<details class="stage ${complete ? 'complete' : ''}" ${st === current ? 'open' : ''}>
  <summary>
    <span class="num">${complete ? '✓' : n}</span>
    <span class="stage-title"><strong>${st.title}</strong><small>${st.duration} · ${done}/${st.items.length}</small></span>
  </summary>
  <div class="stage-body">
    <p class="goal">🎯 ${st.goal}</p>
    <ul class="checklist">
      ${st.items.map((it) => {
        const auto = it.course && Store.isCourseDone(it.course);
        const course = it.course && findCourse(it.course);
        return `<li>
        <label>
          <input type="checkbox" data-item="${it.id}" ${Store.isRoadmapDone(it) ? 'checked' : ''} ${auto ? 'disabled' : ''}>
          <span>${it.label}</span>
        </label>
        ${course ? `<a class="chip" href="#/course/${course.id}">${auto ? '✓ ' : ''}Latihan: ${course.title} →</a>` : ''}
      </li>`;
      }).join('')}
    </ul>
    ${st.project ? `<div class="project"><strong>🛠 Proyek: ${st.project.title}</strong><p>${st.project.desc}</p></div>` : ''}
    <p class="tip">📱 ${st.phoneTip}</p>
  </div>
</details>`;
  }).join('')}
</div>
<p class="center"><button class="btn-link" id="reset-roadmap">Reset checklist roadmap</button></p>`;

  app.querySelectorAll('input[data-item]').forEach((cb) => {
    cb.onchange = () => {
      Store.toggleRoadmap(cb.dataset.item, cb.checked);
      const open = [...app.querySelectorAll('details')].map((d) => d.open);
      renderRoadmap();
      app.querySelectorAll('details').forEach((d, i) => { d.open = open[i]; });
    };
  });
  document.getElementById('reset-roadmap').onclick = () => {
    if (confirm('Hapus semua centang roadmap? (Progres kursus tidak terhapus.)')) {
      Store.resetRoadmap();
      renderRoadmap();
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
<div class="mobile-tabs" id="mobile-tabs">
  <button data-view="instruksi">Instruksi</button>
  <button data-view="kode">Kode</button>
  <button data-view="hasil">Hasil</button>
</div>
<div class="workspace" id="workspace" data-view="instruksi">
  <aside class="panel instructions">
    <h3>Instruksi</h3>
    <div>${ex.instruction}</div>
    <h4>Kriteria</h4>
    <ul id="checks">${ex.checks.map((c) => `<li>${escapeHtml(c.desc)}</li>`).join('')}</ul>
    <div id="feedback"></div>
    <div id="hints"></div>
    <div class="btn-row">
      <button class="btn secondary small" id="hint">Petunjuk</button>
      <button class="btn secondary small" id="solution">Lihat Jawaban</button>
      <button class="btn secondary small" id="reset-code">Reset Kode</button>
    </div>
  </aside>
  <section class="panel editor">
    <div class="tabs" id="tabs"></div>
    <div class="keybar" id="keybar">
      ${['⇥', '<', '>', '/', '=', '"', "'", '{', '}', '(', ')', '[', ']', ';', ':', '.', '+', '-', '*', '!', '#']
        .map((k) => `<button type="button" data-key="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')}
    </div>
    <textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
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

  const workspace = document.getElementById('workspace');
  const setView = (view) => {
    workspace.dataset.view = view;
    document.querySelectorAll('#mobile-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  };
  document.querySelectorAll('#mobile-tabs button').forEach((b) => { b.onclick = () => setView(b.dataset.view); });
  setView('instruksi');

  const insert = (str) => {
    editor.focus();
    editor.setRangeText(str, editor.selectionStart, editor.selectionEnd, 'end');
    files[active].content = editor.value;
    persist();
    clearResults();
  };
  // pointerdown + preventDefault agar keyboard HP tidak tertutup saat tombol simbol ditekan.
  document.querySelectorAll('#keybar button').forEach((b) => {
    b.addEventListener('pointerdown', (e) => e.preventDefault());
    b.onclick = () => insert(b.dataset.key === '⇥' ? '  ' : b.dataset.key);
  });

  const drawTabs = () => {
    tabs.innerHTML = files.map((f, i) => `<button class="tab ${i === active ? 'active' : ''}" data-i="${i}">${f.name}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { active = Number(b.dataset.i); drawTabs(); editor.value = files[active].content; };
    });
  };
  drawTabs();
  editor.value = files[active].content;

  const persist = () => Store.setCode(course.id, idx, Object.fromEntries(files.map((f) => [f.name, f.content])));

  // Hasil cek lama tidak berlaku lagi setelah kode diubah.
  let checked = false;
  const clearResults = () => {
    if (!checked) return;
    checked = false;
    document.getElementById('checks').innerHTML = ex.checks.map((c) => `<li>${escapeHtml(c.desc)}</li>`).join('');
    document.getElementById('feedback').innerHTML = '<p class="stale">Kode berubah. Tekan <b>Cek Jawaban</b> lagi.</p>';
  };

  editor.addEventListener('input', () => { files[active].content = editor.value; persist(); clearResults(); });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('  ');
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
    if (!results.every((r) => r.pass)) setView('instruksi');
    checked = true;
    document.getElementById('checks').innerHTML = results
      .map((r) => `<li class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${escapeHtml(r.desc)}${
        r.why ? `<div class="why">→ ${escapeHtml(r.why)}</div>` : ''}</li>`).join('');

    const notes = [];
    const lint = files.filter((f) => f.name.endsWith('.html')).flatMap((f) => Runner.lintHtml(f.content));
    if (lint.length) {
      notes.push(`<div class="warn"><b>⚠ Periksa tag HTML:</b><ul>${lint.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`);
    }
    if (files.some((f) => f.name.endsWith('.js')) && !results.every((r) => r.pass)) {
      notes.push(`<div class="output-note"><b>Output konsol kamu:</b><pre>${
        ctx.logs.length ? escapeHtml(ctx.logs.join('\n')) : '(tidak ada output)'}</pre></div>`);
    }
    document.getElementById('feedback').innerHTML = notes.join('');
    if (results.every((r) => r.pass)) {
      const firstTime = !Store.isCompleted(course.id, idx);
      Store.complete(course.id, idx);
      updateStats();
      showSuccess(course, idx, firstTime);
    }
  };

  document.getElementById('run').onclick = () => { setView('hasil'); run(); };
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
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === (parts[0] === 'roadmap' ? 'roadmap' : 'home'));
  });
  if (parts.length === 0) renderHome();
  else if (parts[0] === 'roadmap') renderRoadmap();
  else if (parts[0] === 'course' && parts[1]) renderCourse(parts[1]);
  else if (parts[0] === 'lesson' && parts[1] && parts[2] != null) renderLesson(parts[1], Number(parts[2]));
  else renderNotFound();
}

window.addEventListener('hashchange', route);
updateStats();
route();
