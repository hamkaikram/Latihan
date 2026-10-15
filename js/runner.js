// Menjalankan kode peserta di iframe dan menangkap console.log.
const Runner = (() => {
  const CONSOLE_HOOK = `<script>
(function () {
  window.__logs = [];
  function fmt(v) {
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function push(line) {
    window.__logs.push(line);
    if (parent && parent.__onLog) parent.__onLog(line);
  }
  var orig = console.log;
  console.log = function () {
    push(Array.prototype.map.call(arguments, fmt).join(' '));
    orig.apply(console, arguments);
  };
  window.onerror = function (msg) { push('❌ ' + msg); };
})();
<\/script>`;

  // Gabungkan file index.html, style.css, dan script.js menjadi satu dokumen.
  function buildDocument(files) {
    const get = (ext) => files.filter((f) => f.name.endsWith(ext)).map((f) => f.content).join('\n');
    let html = get('.html') || '<!doctype html><html><head></head><body></body></html>';
    const css = get('.css');
    const js = get('.js');

    // Tautan eksternal ke file lokal diganti dengan isi inline.
    html = html.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/gi, '');

    const head = CONSOLE_HOOK + (css ? `<style>${css}</style>` : '');
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => m + head)
      : head + html;

    if (js) {
      const tag = `<script>${js.replace(/<\/script>/gi, '<\\/script>')}<\/script>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, tag + '</body>') : html + tag;
    }
    return html;
  }

  function run(iframe, files, onLog) {
    window.__onLog = onLog;
    return new Promise((resolve) => {
      iframe.onload = () => resolve({
        doc: iframe.contentDocument,
        win: iframe.contentWindow,
        logs: (iframe.contentWindow.__logs || []).slice(),
      });
      iframe.srcdoc = buildDocument(files);
    });
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
      return { desc: c.desc, pass, why };
    });
  }

  // Elemen yang tidak punya tag penutup, atau yang penutupnya boleh dihilangkan.
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const OPTIONAL = new Set(['html', 'head', 'body']);

  // Cari tag HTML yang jumlah pembuka dan penutupnya tidak sama, mis. "<h1>teks<h1>".
  function lintHtml(src) {
    const clean = src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '<$1></$1>');
    const counts = {};
    for (const m of clean.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g)) {
      const tag = m[2].toLowerCase();
      if (VOID.has(tag) || OPTIONAL.has(tag)) continue;
      counts[tag] ??= { open: 0, close: 0 };
      counts[tag][m[1] ? 'close' : 'open']++;
    }
    const warnings = [];
    for (const [tag, { open, close }] of Object.entries(counts)) {
      if (open > close) {
        warnings.push(`Tag <${tag}> dibuka ${open} kali tetapi ditutup ${close} kali. Tag penutup memakai garis miring: </${tag}>.`);
      } else if (close > open) {
        warnings.push(`Ada </${tag}> tanpa pasangan <${tag}>.`);
      }
    }
    return warnings;
  }

  return { run, check, buildDocument, lintHtml };
})();
