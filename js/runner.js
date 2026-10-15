// Menjalankan kode peserta di iframe, menangkap console.log dan error.
const Runner = (() => {
  const MARKER = '/*__KODE_PESERTA__*/';

  const HOOK = `<script>
(function () {
  window.__logs = []; window.__errors = []; window.__silent = false;
  var MAX = 500, cut = false, loops = {};
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (v === null || typeof v !== 'object') return String(v);
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function push(line) {
    if (window.__logs.length >= MAX) {
      if (!cut && parent.__onLog) parent.__onLog('… output dipotong karena terlalu banyak');
      cut = true;
      return;
    }
    window.__logs.push(line);
    if (!window.__silent && parent.__onLog) parent.__onLog(line);
  }
  console.log = function () { push(Array.prototype.map.call(arguments, fmt).join(' ')); };
  window.onerror = function (msg, src, line) {
    var e = { message: String(msg), line: line || 0 };
    window.__errors.push(e);
    if (!window.__silent && parent.__onError) parent.__onError(e);
  };
  // Penjaga perulangan tak berujung: hentikan jika satu perulangan berputar >100.000 kali dalam 1 detik.
  window.__lp = function (id, line) {
    var now = Date.now(), s = loops[id] || (loops[id] = { n: 0, t: now });
    if (now - s.t > 1000) { s.n = 0; s.t = now; }
    if (++s.n > 100000) { s.n = 0; throw new Error('__LOOP_GUARD__:' + line); }
    return true;
  };
  // Link di pratinjau dibuka di tab baru agar pratinjau tidak berpindah halaman.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    ev.preventDefault();
    if (/^https?:/.test(a.getAttribute('href'))) window.open(a.href, '_blank');
  });
})();
<\/script>`;

  // Lewati string dan komentar mulai dari posisi i; kembalikan posisi akhirnya, atau -1.
  function skipLiteral(src, i) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const e = src.indexOf('\n', i);
      return e === -1 ? src.length : e;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      return e === -1 ? src.length : e + 2;
    }
    if (c === '"' || c === "'" || c === '`') {
      let k = i + 1;
      while (k < src.length && src[k] !== c) {
        if (src[k] === '\\') k++;
        else if (c !== '`' && src[k] === '\n') break;
        k++;
      }
      return Math.min(k + 1, src.length);
    }
    return -1;
  }

  // Pecah teks pada pemisah di level teratas (bukan di dalam kurung atau string).
  function splitTop(src, sep) {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < src.length; i++) {
      const e = skipLiteral(src, i);
      if (e !== -1) { i = e - 1; continue; }
      const c = src[i];
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (c === sep && depth === 0) { parts.push(src.slice(start, i)); start = i + 1; }
    }
    parts.push(src.slice(start));
    return parts;
  }

  // Sisipkan __lp() ke kondisi setiap for/while agar perulangan tak berujung tidak membekukan aplikasi.
  // Tidak menambah baris baru sehingga nomor baris error tetap sesuai.
  function protectLoops(src) {
    let out = '';
    let id = 0;
    const isIdent = (c) => !!c && /[\w$]/.test(c);
    for (let i = 0; i < src.length;) {
      const e = skipLiteral(src, i);
      if (e !== -1) { out += src.slice(i, e); i = e; continue; }
      const kw = src.startsWith('for', i) ? 'for' : src.startsWith('while', i) ? 'while' : null;
      if (kw && !isIdent(src[i - 1]) && src[i - 1] !== '.' && !isIdent(src[i + kw.length])) {
        let j = i + kw.length;
        while (/\s/.test(src[j] || '')) j++;
        if (src[j] === '(') {
          let depth = 0;
          let close = -1;
          for (let k = j; k < src.length; k++) {
            const lit = skipLiteral(src, k);
            if (lit !== -1) { k = lit - 1; continue; }
            if (src[k] === '(') depth++;
            else if (src[k] === ')' && --depth === 0) { close = k; break; }
          }
          if (close !== -1) {
            const header = src.slice(j + 1, close);
            const guard = `__lp(${id++},${src.slice(0, i).split('\n').length})`;
            let next = null;
            if (kw === 'while') next = `${guard} && (${header})`;
            else {
              const parts = splitTop(header, ';');
              if (parts.length === 3) next = `${parts[0]};${guard} && (${parts[1].trim() || 'true'});${parts[2]}`;
            }
            if (next !== null) {
              out += src.slice(i, j + 1) + next + ')';
              i = close + 1;
              continue;
            }
          }
        }
      }
      out += src[i];
      i++;
    }
    return out;
  }

  // Gabungkan index.html, style.css, dan script.js menjadi satu dokumen.
  function buildDocument(files) {
    const get = (ext) => files.filter((f) => f.name.endsWith(ext)).map((f) => f.content).join('\n');
    let html = get('.html') || '<!doctype html><html><head></head><body></body></html>';
    const css = get('.css');
    const js = get('.js');

    html = html.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/gi, '');

    const head = HOOK + (css ? `<style>${css}</style>` : '');
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + head) : head + html;

    let jsLine = 0;
    const jsLines = js.split('\n').length;
    if (js.trim()) {
      const safe = protectLoops(js).replace(/<\/script>/gi, '<\\/script>');
      const tag = `<script>${MARKER}\n${safe}\n<\/script>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, () => tag + '</body>') : html + tag;
      jsLine = html.slice(0, html.indexOf(MARKER)).split('\n').length;
    }
    return { html, jsLine, jsLines };
  }

  function run(iframe, files, handlers = {}) {
    const { onLog, onError } = typeof handlers === 'function' ? { onLog: handlers } : handlers;
    const { html, jsLine, jsLines } = buildDocument(files);
    const mapError = (e) => {
      const guard = /__LOOP_GUARD__:(\d+)/.exec(e.message);
      const line = guard ? Number(guard[1]) : (jsLine && e.line > jsLine ? e.line - jsLine : 0);
      return { message: e.message, line: Math.min(line, jsLines) };
    };
    window.__onLog = onLog || null;
    window.__onError = onError ? (e) => onError(mapError(e)) : null;
    return new Promise((resolve) => {
      iframe.onload = () => {
        const win = iframe.contentWindow;
        resolve({
          doc: iframe.contentDocument,
          win,
          logs: (win.__logs || []).slice(),
          errors: (win.__errors || []).map(mapError),
        });
      };
      iframe.srcdoc = html;
    });
  }

  // Jalankan ulang kode di iframe yang sama tanpa menampilkan output (mis. menguji nilai lain).
  function rerun(win, js) {
    const before = win.__logs.length;
    const errorsBefore = win.__errors.length;
    win.__silent = true;
    try {
      win.eval(`{\n${protectLoops(js)}\n}`);
    } catch {
      return null;
    } finally {
      win.__silent = false;
    }
    if (win.__errors.length > errorsBefore) return null;
    return win.__logs.slice(before);
  }

  function check(exercise, ctx, files) {
    const code = Object.fromEntries(files.map((f) => [f.name, f.content]));
    return exercise.checks.map((c) => {
      let pass = false;
      let why = null;
      try { pass = !!c.test({ ...ctx, code }); } catch { pass = false; }
      if (!pass && c.why) {
        try { why = c.why({ ...ctx, code }); } catch { why = null; }
      }
      return { desc: c.desc, pass, why, guard: !!c.guard };
    });
  }

  return { run, rerun, check, buildDocument, protectLoops };
})();
