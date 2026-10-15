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
  const started = Store.isCompleted(course.id, idx) || !!Store.getCode(course.id, idx);

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
  ${started && !last ? '<p class="center"><button class="btn-link" id="skip">Lewati ke latihan →</button></p>' : ''}
</section>`;
    document.getElementById('prev').onclick = () => { slide--; draw(); };
    document.getElementById('next').onclick = () => {
      if (last) renderExercise(course, idx);
      else { slide++; draw(); }
    };
    const skip = document.getElementById('skip');
    if (skip) skip.onclick = () => renderExercise(course, idx);
  };
  draw();
}

// ---------- Pelajaran: latihan ----------
const KEYS = {
  html: ['↶', '⇥', '</>', '<', '>', '/', '=', '"', '!', '-'],
  css: ['↶', '⇥', '{', '}', ':', ';', '.', '#', '-', '%'],
  js: ['↶', '⇥', '(', ')', '{', '}', '"', "'", ';', '=', '.', '+', '*', '<', '>', '[', ']', '!', '`', '$'],
};
const langOf = (name) => (name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : 'js');
// `kode` di dalam teks petunjuk ditampilkan sebagai <code>.
const formatHint = (h) => escapeHtml(h).replace(/`([^`]+)`/g, '<code>$1</code>');

function renderExercise(course, idx) {
  const lesson = course.lessons[idx];
  const ex = lesson.exercise;
  const saved = Store.getCode(course.id, idx);
  const files = ex.files.map((f) => ({ name: f.name, content: Lint.normalizeQuotes(saved?.[f.name] ?? f.content) }));
  const isJs = files.every((f) => f.name.endsWith('.js'));
  const jsFile = files.find((f) => f.name.endsWith('.js'));
  const criteria = ex.checks.filter((c) => !c.guard);
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
    <details class="guide" ${Store.xp() === 0 ? 'open' : ''}>
      <summary>🧭 Cara mengerjakan</summary>
      <ol>
        <li>Baca instruksi dan kriteria di bawah.</li>
        <li>Tulis kode di tab <b>Kode</b>. Tombol di atas keyboard: <b>&lt;/&gt;</b> menutup tag terakhir, <b>↶</b> membatalkan ketikan.</li>
        <li>Tekan <b>▶ Jalankan</b> untuk melihat hasil.</li>
        <li>Tekan <b>Cek Jawaban</b>. Jika ada yang salah, penjelasannya muncul di tab ini.</li>
      </ol>
    </details>
    <details class="materi">
      <summary>📖 Baca materi lagi</summary>
      ${lesson.slides.map((s) => `<h4>${s.title}</h4>${s.body}`).join('')}
    </details>
    <h3>Instruksi</h3>
    <div>${ex.instruction}</div>
    <h4>Kriteria</h4>
    <div id="summary"></div>
    <ul id="checks"></ul>
    <div id="feedback"></div>
    <div id="hints"></div>
    <div id="solution-box"></div>
    <div class="btn-row">
      <button class="btn secondary small" id="hint"></button>
      <button class="btn secondary small" id="solution">Lihat Jawaban</button>
      <button class="btn secondary small" id="reset-code">Reset Kode</button>
    </div>
    <button class="btn mobile-only" id="to-code">Tulis kode →</button>
  </aside>
  <section class="panel editor">
    <div class="tabs" id="tabs"></div>
    <div class="keybar" id="keybar"></div>
    <textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Editor kode"></textarea>
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
  const keybar = document.getElementById('keybar');
  const iframe = document.getElementById('preview');
  const consoleEl = document.getElementById('console');
  const checksEl = document.getElementById('checks');
  const summaryEl = document.getElementById('summary');
  const feedbackEl = document.getElementById('feedback');
  const hintBtn = document.getElementById('hint');

  const workspace = document.getElementById('workspace');
  const setView = (view) => {
    workspace.dataset.view = view;
    document.querySelectorAll('#mobile-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  };
  document.querySelectorAll('#mobile-tabs button').forEach((b) => { b.onclick = () => setView(b.dataset.view); });
  document.getElementById('to-code').onclick = () => { setView('kode'); editor.focus(); };
  setView('instruksi');

  const drawCriteria = () => {
    checksEl.innerHTML = criteria.map((c) => `<li>${escapeHtml(c.desc)}</li>`).join('');
    summaryEl.innerHTML = '';
  };
  drawCriteria();

  const persist = () => Store.setCode(course.id, idx, Object.fromEntries(files.map((f) => [f.name, f.content])));

  // Hasil cek lama tidak berlaku lagi setelah kode diubah.
  let checked = false;
  const clearResults = () => {
    if (!checked) return;
    checked = false;
    drawCriteria();
    feedbackEl.innerHTML = '<p class="stale">Kode berubah. Tekan <b>Cek Jawaban</b> lagi.</p>';
  };

  const onEdit = () => {
    const fixed = Lint.normalizeQuotes(editor.value);
    if (fixed !== editor.value) {
      const { selectionStart: s, selectionEnd: e } = editor;
      editor.value = fixed;
      editor.setSelectionRange(s, e);
    }
    files[active].content = editor.value;
    persist();
    clearResults();
  };

  // Riwayat undo sendiri, per file, per kata: undo bawaan browser bisa menghapus semua ketikan sekaligus.
  const history = Object.fromEntries(files.map((f) => [f.name, []]));
  let lastEdit = 0;
  const pushHistory = () => {
    const stack = history[files[active].name];
    stack.push({ value: editor.value, start: editor.selectionStart, end: editor.selectionEnd });
    if (stack.length > 300) stack.shift();
  };
  editor.addEventListener('beforeinput', (e) => {
    if (inserting) return;
    const now = Date.now();
    // Keyboard Android mengetik lewat composition; perlakukan seperti mengetik huruf dalam satu kata.
    const wordChar = (e.inputType === 'insertText' && /^\w$/.test(e.data || '')) || e.inputType === 'insertCompositionText';
    const deleting = e.inputType.startsWith('delete');
    if (!wordChar && !deleting) pushHistory();
    else if (now - lastEdit > 1000 || !history[files[active].name].length) pushHistory();
    lastEdit = now;
  });
  const undo = () => {
    const prev = history[files[active].name].pop();
    if (!prev) return;
    editor.value = prev.value;
    editor.setSelectionRange(prev.start, prev.end);
    files[active].content = editor.value;
    persist();
    clearResults();
  };
  // Ganti seluruh isi file (reset/jawaban) tanpa kehilangan riwayat undo.
  const replaceAll = (changes) => {
    files.forEach((f, i) => {
      if (changes[f.name] == null || changes[f.name] === f.content) return;
      history[f.name].push({ value: f.content, start: 0, end: 0 });
      files[i].content = changes[f.name];
    });
    editor.value = files[active].content;
    persist();
    clearResults();
    run();
  };

  // Sisipan dari tombol simbol selalu menjadi satu langkah undo tersendiri.
  let inserting = false;
  const insert = (str) => {
    editor.focus();
    pushHistory();
    inserting = true;
    const ok = document.execCommand('insertText', false, str);
    inserting = false;
    if (!ok) {
      editor.setRangeText(str, editor.selectionStart, editor.selectionEnd, 'end');
      onEdit();
    }
  };

  const drawKeys = () => {
    keybar.innerHTML = KEYS[langOf(files[active].name)]
      .map((k) => `<button type="button" data-key="${escapeHtml(k)}" aria-label="${k === '↶' ? 'Batalkan' : k === '⇥' ? 'Tab' : k === '</>' ? 'Tutup tag' : escapeHtml(k)}">${escapeHtml(k)}</button>`).join('');
    keybar.querySelectorAll('button').forEach((b) => {
      // pointerdown + preventDefault agar keyboard HP tidak tertutup saat tombol ditekan.
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.onclick = () => {
        const k = b.dataset.key;
        if (k === '↶') { editor.focus(); undo(); return; }
        if (k === '⇥') return insert('  ');
        if (k === '</>') {
          const tag = Lint.openTagBefore(editor.value.slice(0, editor.selectionStart));
          return insert(tag ? `</${tag}>` : '</');
        }
        insert(k);
      };
    });
  };

  const drawTabs = () => {
    tabs.innerHTML = files.map((f, i) => `<button class="tab ${i === active ? 'active' : ''}" data-i="${i}">${f.name}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { active = Number(b.dataset.i); drawTabs(); editor.value = files[active].content; };
    });
    drawKeys();
  };
  drawTabs();
  editor.value = files[active].content;

  editor.addEventListener('input', onEdit);
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('  ');
    } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      check();
    } else if (e.key === 'Enter' && !e.isComposing) {
      // Indentasi otomatis: ikuti spasi baris sebelumnya, tambah 2 setelah { ( [ atau tag pembungkus.
      const before = editor.value.slice(0, editor.selectionStart);
      const indent = before.slice(before.lastIndexOf('\n') + 1).match(/^[ \t]*/)[0];
      const after = editor.value.slice(editor.selectionEnd);
      const open = (editor.value.match(/\{/g) || []).length - (editor.value.match(/\}/g) || []).length;
      if (/\{\s*$/.test(before) && !/^\s*\}/.test(after) && open > 0) {
        // Setelah { langsung siapkan } penutupnya, kursor di baris tengah.
        e.preventDefault();
        const pos = editor.selectionStart + 1 + indent.length + 2;
        insert(`\n${indent}  \n${indent}}`);
        editor.setSelectionRange(pos, pos);
        return;
      }
      const extra = /[{([]\s*$/.test(before) || /<(ul|ol|div|nav|section|main|header|footer)\b[^>]*>\s*$/i.test(before) ? '  ' : '';
      if (indent || extra) {
        e.preventDefault();
        insert('\n' + indent + extra);
      }
    }
  });

  const errorLine = (e) => {
    const msg = Lint.explainError(e.message, jsFile?.content || '') || e.message;
    return `❌ ${e.line ? `Baris ${e.line}: ` : ''}${msg}`;
  };
  const run = async () => {
    consoleEl.textContent = '';
    return Runner.run(iframe, files, {
      onLog: (line) => { consoleEl.textContent += line + '\n'; },
      onError: (e) => { consoleEl.textContent += errorLine(e) + '\n'; },
    });
  };

  const check = async () => {
    const ctx = await run();
    const results = Runner.check(ex, ctx, files);
    const { errors, warnings } = Lint.collect(ctx, files);
    const blocking = warnings.filter((w) => w.block);
    const shown = results.filter((r) => !r.guard || !r.pass);
    const main = results.filter((r) => !r.guard);
    const passed = main.filter((r) => r.pass).length;
    const success = results.every((r) => r.pass) && !errors.length && !blocking.length;
    checked = true;

    checksEl.innerHTML = shown
      .map((r) => `<li class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${escapeHtml(r.desc)}${
        r.why ? `<div class="why">→ ${escapeHtml(r.why)}</div>` : ''}</li>`).join('');

    let summary;
    if (success) summary = '<p class="summary ok">Semua kriteria terpenuhi!</p>';
    else if (errors.length) summary = '<p class="summary">Perbaiki error ini dulu. Kode berhenti di sini, jadi kriteria di bawah belum bisa terpenuhi.</p>';
    else if (results.every((r) => r.pass)) summary = '<p class="summary">Hampir! Semua kriteria terpenuhi, tetapi ada yang perlu dirapikan dulu:</p>';
    else summary = `<p class="summary">${passed} dari ${main.length} kriteria terpenuhi. Baca penjelasan di bawah tanda ✗.</p>`;
    if (errors.length) {
      summary += `<div class="error-box"><b>❌ Error</b>${errors.map((e) => `
        <div class="error-item">
          ${e.line ? `<div>Baris ${e.line}${e.code ? `: <code>${escapeHtml(e.code)}</code>` : ''}</div>` : ''}
          <div>${escapeHtml(e.msg)}</div>
          ${e.msg !== e.raw ? `<small>Pesan asli: ${escapeHtml(e.raw)}</small>` : ''}
        </div>`).join('')}</div>`;
    }
    if (warnings.length) {
      summary += `<div class="warn"><b>⚠ Periksa kode:</b><ul>${warnings.map((w) => `<li>${files.length > 1 ? `${w.file} ` : ''}baris ${w.line}: ${escapeHtml(w.msg)}</li>`).join('')}</ul></div>`;
    }
    summaryEl.innerHTML = summary;

    const notes = [];
    if (jsFile && !success && (isJs || ctx.logs.length)) {
      notes.push(`<div class="output-note"><b>Output konsol kamu:</b><pre>${
        ctx.logs.length ? escapeHtml(ctx.logs.join('\n')) : '(tidak ada output)'}</pre></div>`);
    }
    feedbackEl.innerHTML = notes.join('');

    if (success) {
      const firstTime = !Store.isCompleted(course.id, idx);
      Store.complete(course.id, idx);
      updateStats();
      showSuccess(course, idx, firstTime);
    } else {
      setView('instruksi');
      summaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const drawHintButton = () => {
    hintBtn.textContent = hintShown < ex.hints.length ? `💡 Petunjuk ${hintShown + 1}/${ex.hints.length}` : '💡 Semua petunjuk sudah tampil';
    hintBtn.disabled = hintShown >= ex.hints.length;
  };
  drawHintButton();
  hintBtn.onclick = () => {
    hintShown++;
    document.getElementById('hints').innerHTML = ex.hints.slice(0, hintShown)
      .map((h, i) => `<div class="hint">💡 ${i + 1}. ${formatHint(h)}</div>`).join('');
    drawHintButton();
  };

  const solutionBtn = document.getElementById('solution');
  const solutionBox = document.getElementById('solution-box');
  solutionBtn.onclick = () => {
    if (solutionBox.innerHTML) {
      solutionBox.innerHTML = '';
      solutionBtn.textContent = 'Lihat Jawaban';
      return;
    }
    solutionBtn.textContent = 'Sembunyikan Jawaban';
    solutionBox.innerHTML = `<div class="solution">
      <p>Bandingkan dengan kodemu, lalu coba perbaiki sendiri.</p>
      ${Object.entries(ex.solution).map(([name, code]) => `<b>${name}</b><pre>${escapeHtml(code)}</pre>`).join('')}
      <button class="btn secondary small" id="use-solution">Salin jawaban ke editor</button>
    </div>`;
    document.getElementById('use-solution').onclick = () => {
      if (!confirm('Kode kamu akan diganti dengan jawaban (bisa dibatalkan dengan ↶). Lanjutkan?')) return;
      replaceAll(ex.solution);
    };
  };
  document.getElementById('reset-code').onclick = () => {
    if (!confirm('Kembalikan kode ke awal? (Bisa dibatalkan dengan ↶.)')) return;
    replaceAll(Object.fromEntries(ex.files.map((f) => [f.name, f.content])));
  };

  document.getElementById('run').onclick = () => { setView('hasil'); run(); };
  document.getElementById('check').onclick = check;
  run();
}

function showSuccess(course, idx, firstTime) {
  const hasNext = idx + 1 < course.lessons.length;
  const nextCourse = COURSES[COURSES.indexOf(course) + 1];
  const next = hasNext
    ? `<a class="btn" href="#/lesson/${course.id}/${idx + 1}">Pelajaran berikutnya →</a>`
    : nextCourse
      ? `<a class="btn" href="#/lesson/${nextCourse.id}/0">Lanjut ke ${nextCourse.title} →</a>`
      : '<a class="btn" href="#/roadmap">Lihat roadmap →</a>';
  const modal = document.getElementById('modal');
  modal.innerHTML = `
<div class="modal-backdrop">
  <div class="modal">
    <div class="big">🎉</div>
    <h2>${hasNext ? 'Latihan selesai!' : `${course.title} selesai!`}</h2>
    <p>${firstTime ? '+50 XP' : 'Sudah pernah diselesaikan'}</p>
    <div class="btn-row center">
      <button class="btn secondary" id="stay">Tetap di sini</button>
      ${next}
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
