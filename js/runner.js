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
      try { pass = !!c.test({ ...ctx, code }); } catch { pass = false; }
      return { desc: c.desc, pass };
    });
  }

  return { run, check, buildDocument };
})();
