// Analisis kode peserta untuk memberi penjelasan yang ramah pemula.
// Setiap temuan: { file, line, msg, block } — block=true berarti harus dibereskan sebelum lulus.
const Lint = (() => {
  const lineAt = (src, idx) => src.slice(0, idx).split('\n').length;
  // Ganti isi dengan spasi agar indeks dan nomor baris tetap sama.
  const blank = (s) => s.replace(/[^\n]/g, ' ');

  function levenshtein(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return d[a.length][b.length];
  }

  // Cari kata yang paling mirip (beda huruf besar-kecil, salah ketik, atau awalan).
  function suggest(word, candidates) {
    const w = word.toLowerCase();
    let best = null;
    let bestD = Infinity;
    for (const c of candidates) {
      if (c === word) continue;
      const lc = c.toLowerCase();
      if (lc === w) return c;
      const d = levenshtein(w, lc);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best && (bestD <= (w.length > 5 ? 2 : 1) || w.startsWith(best.toLowerCase()))) return best;
    return null;
  }

  // Keyboard HP (terutama iOS) bisa mengubah " menjadi “ ” yang tidak dikenali kode.
  const normalizeQuotes = (s) => s.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'");

  // ---------- HTML ----------
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const OPTIONAL = new Set(['html', 'head', 'body']);
  const NO_NEST = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'li', 'button', 'label', 'title', 'option']);
  const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

  function html(src) {
    const out = [];
    const add = (idx, msg, block = true) => out.push({ line: lineAt(src, idx), msg, block });

    let clean = src.replace(/<!--[\s\S]*?(?:-->|$)/g, (m, idx) => {
      if (/<[a-zA-Z]/.test(m.slice(4))) {
        add(idx, 'Kode di dalam <!-- ... --> adalah komentar, jadi tidak ditampilkan. Tulis kodenya di luar komentar (setelah -->).', false);
      }
      return blank(m);
    });
    clean = clean.replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (m, open, tag, body, close) => open + blank(body) + close);

    for (const m of clean.matchAll(/<\s+\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)) {
      add(m.index, `Jangan ada spasi di antara < dan nama tag. Tulis <${m[1]}>, bukan < ${m[1]}>.`);
    }
    for (const m of clean.matchAll(/<\/\s+([a-zA-Z][a-zA-Z0-9]*)/g)) {
      add(m.index, `Jangan ada spasi setelah </. Tulis </${m[1]}>.`);
    }

    const stack = [];
    for (const m of clean.matchAll(TAG_RE)) {
      const [, slash, raw, attrs] = m;
      const tag = raw.toLowerCase();
      if (!slash) {
        if (attrs.includes('<')) add(m.index, `Tanda > untuk menutup <${tag} sepertinya kurang.`);
        if (((attrs.match(/"/g) || []).length) % 2) add(m.index, `Tanda kutip " pada atribut <${tag}> tidak berpasangan. Setiap nilai atribut diapit dua tanda kutip: href="...".`);
        const noEq = attrs.match(/(?:^|\s)([a-zA-Z-]+)\s+["']/);
        if (noEq) add(m.index, `Tambahkan tanda = di antara ${noEq[1]} dan nilainya: ${noEq[1]}="...".`);
      }
      if (VOID.has(tag)) {
        if (slash) add(m.index, `<${tag}> tidak punya tag penutup. Hapus </${tag}>.`);
        continue;
      }
      if (OPTIONAL.has(tag)) continue;

      if (!slash) {
        const top = stack[stack.length - 1];
        if (top && top.tag === tag && NO_NEST.has(tag)) {
          add(m.index, `<${tag}> dibuka lagi padahal <${tag}> di baris ${top.line} belum ditutup. Mungkin maksudmu tag penutup </${tag}> (pakai garis miring)?`);
          stack.pop();
          continue;
        }
        stack.push({ tag, line: lineAt(src, m.index) });
        continue;
      }

      const pos = stack.map((s) => s.tag).lastIndexOf(tag);
      if (pos === -1) {
        const top = stack.pop();
        if (top) add(m.index, `<${top.tag}> (baris ${top.line}) ditutup dengan </${tag}>. Pembuka dan penutup harus sama: <${top.tag}>...</${top.tag}>.`);
        else add(m.index, `Ada </${tag}> tanpa tag pembuka <${tag}>.`);
        continue;
      }
      for (const open of stack.splice(pos).slice(1)) {
        add(m.index, `<${open.tag}> di baris ${open.line} belum ditutup. Tambahkan </${open.tag}> sebelum </${tag}>.`);
      }
    }
    for (const open of stack) {
      out.push({ line: open.line, msg: `<${open.tag}> belum ditutup. Tambahkan </${open.tag}> setelah isinya.`, block: true });
    }

    let textOnly = clean.replace(TAG_RE, (m) => blank(m));
    const cssLike = /[a-zA-Z.#][\w-]*\s*\{[^}]*:[^}]*\}/.exec(textOnly);
    if (cssLike) {
      add(cssLike.index, 'Sepertinya ada kode CSS di file HTML. Tulis CSS di tab style.css.');
      textOnly = textOnly.replace(/[a-zA-Z.#][\w-]*\s*\{[^}]*\}/g, blank);
    }
    for (const m of textOnly.matchAll(/(^|\s)(\/?)(h[1-6]|p|ul|ol|li)(?=\s|$)/gim)) {
      if (!m[2] && !/^h[1-6]$/i.test(m[3])) continue; // "p", "li" polos bisa jadi kata biasa
      const name = m[3].toLowerCase();
      add(m.index + m[1].length, `"${m[2]}${m[3]}" perlu ditulis sebagai tag dengan kurung sudut: <${name}> untuk membuka dan </${name}> untuk menutup.`);
    }
    return out;
  }

  // Cari tag terakhir yang belum ditutup sebelum kursor (untuk tombol </> di HP).
  function openTagBefore(src) {
    const clean = src.replace(/<!--[\s\S]*?(?:-->|$)/g, blank);
    const stack = [];
    for (const m of clean.matchAll(TAG_RE)) {
      const tag = m[2].toLowerCase();
      if (VOID.has(tag)) continue;
      if (!m[1]) stack.push(tag);
      else {
        const pos = stack.lastIndexOf(tag);
        if (pos !== -1) stack.splice(pos);
      }
    }
    return stack.pop() || null;
  }

  // ---------- CSS ----------
  const KNOWN_PROPS = ['color', 'background', 'background-color', 'font-size', 'font-weight', 'font-family', 'font-style',
    'padding', 'margin', 'border', 'border-radius', 'border-color', 'border-width', 'border-style', 'display',
    'justify-content', 'align-items', 'gap', 'flex-wrap', 'flex-direction', 'flex', 'width', 'height', 'max-width',
    'min-width', 'text-align', 'line-height', 'text-decoration', 'grid-template-columns', 'opacity', 'box-shadow',
    'cursor', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'overflow', 'transition', 'transform'];
  const COLOR_ID = {
    merah: 'red', biru: 'blue', hijau: 'green', kuning: 'yellow', hitam: 'black', putih: 'white', ungu: 'purple',
    oranye: 'orange', jingga: 'orange', coklat: 'brown', cokelat: 'brown', abu: 'gray', 'abu-abu': 'gray',
    'merah muda': 'pink', 'kuning muda': 'lightyellow', emas: 'gold', perak: 'silver',
  };
  const UNITLESS = new Set(['font-weight', 'line-height', 'opacity', 'z-index', 'flex', 'flex-grow', 'flex-shrink', 'order']);
  const COMMON_VALUES = {
    display: ['flex', 'block', 'inline', 'inline-block', 'grid', 'none'],
    'justify-content': ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    'align-items': ['flex-start', 'center', 'flex-end', 'stretch'],
    'flex-wrap': ['wrap', 'nowrap'],
    'flex-direction': ['row', 'column'],
    'font-weight': ['normal', 'bold'],
    'text-align': ['left', 'center', 'right'],
    'border-style': ['solid', 'dashed', 'dotted'],
  };

  function explainValue(prop, value) {
    const base = `Nilai "${value}" tidak valid untuk ${prop}.`;
    if (/[\w-]+\s*:/.test(value)) {
      const before = value.split(/\s+[\w-]+\s*:/)[0];
      return `Titik koma (;) sepertinya kurang setelah "${prop}: ${before}". Setiap properti diakhiri ;`;
    }
    if (/^-?\d+(\.\d+)?$/.test(value) && !UNITLESS.has(prop)) return `${base} Angka ukuran perlu satuan, mis. ${value}px.`;
    if (/^-?\d+(\.\d+)?\s+(px|em|rem|%|vh|vw)$/.test(value)) return `${base} Jangan pakai spasi antara angka dan satuan: ${value.replace(/\s+/, '')}.`;
    const lower = value.toLowerCase();
    if (COLOR_ID[lower]) return `${base} Nama warna memakai bahasa Inggris, mis. ${COLOR_ID[lower]}.`;
    if (COMMON_VALUES[prop]) {
      const s = suggest(lower, COMMON_VALUES[prop]);
      return s ? `${base} Mungkin maksudmu "${s}"?` : `${base} Contoh nilai yang benar: ${COMMON_VALUES[prop].join(', ')}.`;
    }
    return base;
  }

  function css(src, doc) {
    const out = [];
    const add = (idx, msg, block = true) => out.push({ line: lineAt(src, idx), msg, block });

    let clean = src.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, (m, idx) => {
      if (/[\w.#-]+\s*\{[^}]*:/.test(m)) {
        add(idx, 'Kode di dalam /* ... */ adalah komentar, jadi tidak dijalankan. Tulis kodenya di luar komentar (setelah */).', false);
      }
      return blank(m);
    });
    clean = clean.replace(/<\/?style[^>]*>/gi, (m, idx) => {
      add(idx, 'File .css langsung berisi aturan CSS, tanpa tag <style>. Hapus <style> dan </style>.');
      return blank(m);
    });

    const opens = [];
    const reported = new Set();
    let unbalanced = false;
    for (let i = 0; i < clean.length; i++) {
      if (clean[i] === '{') {
        const prev = opens[opens.length - 1];
        if (prev !== undefined && !reported.has(prev)) {
          reported.add(prev);
          add(prev, 'Kurung kurawal { di baris ini belum ditutup dengan } sebelum aturan berikutnya.');
        }
        opens.push(i);
      } else if (clean[i] === '}') {
        if (opens.length) opens.pop();
        else { unbalanced = true; add(i, 'Ada } berlebih tanpa pasangan {.'); }
      }
    }
    for (const i of opens) if (!reported.has(i)) add(i, 'Kurung kurawal { belum ditutup dengan }.');
    unbalanced ||= reported.size > 0 || opens.length > 0;

    const RULE_RE = /([^{};]*)\{([^{}]*)\}/g;
    const leftovers = clean.replace(RULE_RE, (m) => blank(m));
    const stray = /[\w-]+\s*:\s*[^;\n]+/.exec(leftovers);
    if (stray && !unbalanced) add(stray.index, 'Properti CSS harus ditulis di dalam kurung kurawal { } milik sebuah selector, mis. .kartu { padding: 16px; }');

    for (const m of clean.matchAll(RULE_RE)) {
      const selIdx = m.index + (m[1].length - m[1].trimStart().length);
      for (const sel of m[1].split(',').map((s) => s.trim()).filter(Boolean)) checkSelector(sel, selIdx, doc, add);

      let off = m.index + m[0].indexOf('{') + 1;
      for (const part of m[2].split(';')) {
        const idx = off + (part.length - part.trimStart().length);
        off += part.length + 1;
        const decl = part.trim();
        if (!decl) continue;
        const colon = decl.indexOf(':');
        if (colon === -1) {
          add(idx, `"${decl}" kurang tanda titik dua (:) di antara properti dan nilai, mis. color: red;`);
          continue;
        }
        const prop = decl.slice(0, colon).trim().toLowerCase();
        const value = decl.slice(colon + 1).trim().replace(/\s*!important$/i, '');
        if (prop.startsWith('--')) continue;
        if (!CSS.supports(prop, 'inherit')) {
          const s = suggest(prop, KNOWN_PROPS);
          add(idx, `Properti "${prop}" tidak dikenal.${s ? ` Mungkin maksudmu "${s}"?` : ''}`);
        } else if (!value) {
          add(idx, `Nilai untuk ${prop} masih kosong.`);
        } else if (!CSS.supports(prop, value)) {
          add(idx, explainValue(prop, value));
        }
      }
    }
    return out;
  }

  function checkSelector(sel, idx, doc, add) {
    if (!doc || /[:*]/.test(sel)) return;
    let found;
    try { found = doc.querySelectorAll(sel).length; } catch {
      add(idx, `Selector "${sel}" tidak valid.`);
      return;
    }
    if (found) return;
    const name = sel.replace(/^[.#]/, '');
    let tip = '';
    if (/^[a-zA-Z][\w-]*$/.test(name)) {
      const classes = [...new Set([...doc.querySelectorAll('[class]')].flatMap((e) => [...e.classList]))];
      if (!/^[.#]/.test(sel) && classes.includes(name)) tip = ` "${name}" adalah class, jadi awali dengan titik: .${name}`;
      else if (!/^[.#]/.test(sel) && doc.getElementById(name)) tip = ` "${name}" adalah id, jadi awali dengan #: #${name}`;
      else if (/^[.#]/.test(sel) && doc.querySelector(name)) tip = ` "${name}" adalah nama tag, tulis tanpa ${sel[0]}: ${name}`;
      else if (sel.startsWith('.')) {
        const s = suggest(name, classes);
        if (s) tip = ` Mungkin maksudmu .${s}?`;
      }
    }
    add(idx, `Selector "${sel}" tidak mengenai elemen apa pun di halaman.${tip}`, false);
  }

  // ---------- JavaScript ----------
  // Cari kurung ( [ { yang tidak berpasangan, dengan mengabaikan isi string dan komentar.
  function brackets(src) {
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const stack = [];
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') {
        i = src.indexOf('\n', i);
        if (i === -1) break;
      } else if (c === '/' && src[i + 1] === '*') {
        const e = src.indexOf('*/', i + 2);
        if (e === -1) break;
        i = e + 1;
      } else if (c === '"' || c === "'" || c === '`') {
        let k = i + 1;
        while (k < src.length && src[k] !== c && !(c !== '`' && src[k] === '\n')) k += src[k] === '\\' ? 2 : 1;
        i = k;
      } else if (pairs[c]) {
        stack.push(i);
      } else if (')]}'.includes(c)) {
        const top = stack.pop();
        if (top === undefined) out.push({ line: lineAt(src, i), msg: `Ada ${c} berlebih tanpa pasangan.`, block: true });
        else if (pairs[src[top]] !== c) out.push({ line: lineAt(src, i), msg: `${src[top]} di baris ${lineAt(src, top)} ditutup dengan ${c}; seharusnya ${pairs[src[top]]}.`, block: true });
      }
    }
    for (const i of stack) out.push({ line: lineAt(src, i), msg: `${src[i]} di baris ini belum ditutup dengan ${pairs[src[i]]}.`, block: true });
    return out;
  }

  function jsStatic(src) {
    const out = brackets(src);
    for (const m of src.matchAll(/\bfor\s*\(([^)]*)\)/g)) {
      const head = m[1];
      if (!head.includes(';') && head.includes(',') && !/\s(of|in)\s/.test(head)) {
        out.push({ line: lineAt(src, m.index), msg: 'Bagian-bagian di dalam for dipisah titik koma (;), bukan koma: for (let i = 1; i <= 5; i++)', block: true });
      }
    }
    src.split('\n').forEach((line, i) => {
      const c = line.indexOf('//');
      if (c !== -1 && !/["'`]/.test(line.slice(0, c)) && /(console\.|const |let |function |if\s*\(|for\s*\(|document\.)/.test(line.slice(c + 2))) {
        out.push({ line: i + 1, msg: 'Kode setelah // dianggap komentar sehingga tidak dijalankan. Pindahkan kodenya ke baris baru.', block: false });
      }
    });
    return out;
  }

  const declaredNames = (code) => [...code.matchAll(/(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);

  // Terjemahkan pesan error JavaScript ke penjelasan bahasa Indonesia.
  function explainError(raw, code = '') {
    const msg = raw.replace(/^Uncaught\s+/, '');
    let m;
    if (msg.includes('__LOOP_GUARD__')) {
      return 'Perulangan berjalan terlalu lama sehingga dihentikan. Kemungkinan kondisinya tidak pernah bernilai false, mis. memakai i-- padahal seharusnya i++.';
    }
    if ((m = msg.match(/ReferenceError: (\S+) is not defined/))) {
      const declared = declaredNames(code);
      const s = suggest(m[1], ['console', 'document', ...declared]);
      if (s && declared.includes(s)) return `"${m[1]}" tidak dikenal. Variabel yang kamu buat bernama "${s}". Nama harus sama persis di semua tempat, termasuk huruf besar-kecil.`;
      if (s) return `"${m[1]}" tidak dikenal. Mungkin maksudmu "${s}"? Huruf besar-kecil harus sama persis.`;
      return `"${m[1]}" tidak dikenal. Kalau maksudmu teks, apit dengan tanda kutip: "${m[1]}". Kalau variabel, buat dulu dengan const atau let.`;
    }
    if ((m = msg.match(/TypeError: (.+) is not a function/))) {
      const last = m[1].split('.').pop();
      const s = suggest(last, ['log', 'getElementById', 'addEventListener', 'querySelector', 'push', ...declaredNames(code)]);
      return `${m[1]} bukan function.${s ? ` Mungkin maksudmu "${s}"?` : ' Periksa ejaannya.'}`;
    }
    if (/Cannot (read|set) properties of null/.test(msg)) {
      return 'Elemen tidak ditemukan (null). Periksa id di getElementById: harus sama persis dengan id di HTML, termasuk huruf besar-kecil.';
    }
    if ((m = msg.match(/Cannot (?:read|set) properties of undefined \(\w+ '([^']+)'\)/))) {
      return `Mencoba memakai "${m[1]}" dari sesuatu yang belum ada (undefined).`;
    }
    if (/Assignment to constant variable/.test(msg)) return 'Nilai const tidak bisa diubah. Ganti const menjadi let untuk variabel yang nilainya berubah.';
    if ((m = msg.match(/Identifier '([^']+)' has already been declared/)) && new RegExp(`for\\s*\\(\\s*let\\s+${m[1]}\\s*=[^;)]*,`).test(code)) {
      return 'Bagian-bagian di dalam for dipisah titik koma (;), bukan koma: for (let i = 1; i <= 5; i++)';
    }
    if (m) return `Variabel "${m[1]}" dibuat lebih dari sekali. Hapus const/let pada pembuatan yang kedua.`;
    if (/Missing initializer in const declaration/.test(msg)) return 'const harus langsung diberi nilai, mis. const total = 0;';
    if (/Invalid shorthand property initializer/.test(msg)) return 'Di dalam object, pakai titik dua, bukan tanda =. Contoh: judul: "Laskar Pelangi"';
    if (/missing \) after argument list/.test(msg)) return 'Tanda kurung tutup ) kurang, atau teks belum diapit tanda kutip. Contoh benar: console.log("Halo");';
    if (/Invalid or unexpected token/.test(msg)) return 'Ada karakter yang tidak dikenali, biasanya tanda kutip yang tidak berpasangan.';
    if (/Unexpected end of input/.test(msg)) return 'Kode berakhir terlalu cepat: ada { atau ( yang belum ditutup.';
    if ((m = msg.match(/Unexpected identifier '?([^']*)'?/))) return `Kata "${m[1]}" muncul di tempat yang tidak terduga. Mungkin koma (,), tanda +, atau tanda kutip kurang sebelum kata itu.`;
    if (/Unexpected string/.test(msg)) return 'Ada teks dalam kutip di tempat yang salah. Mungkin tanda + atau koma (,) kurang.';
    if (/Unexpected number/.test(msg)) return 'Ada angka di tempat yang salah. Mungkin tanda + atau koma (,) kurang.';
    if (/Invalid left-hand side in assignment/.test(msg)) return 'Tanda = dipakai di tempat yang salah. Untuk membandingkan, gunakan === atau >, bukan =.';
    if (/Maximum call stack size exceeded/.test(msg)) return 'Function memanggil dirinya sendiri terus-menerus.';
    if ((m = msg.match(/Unexpected token '([^']+)'/))) {
      const t = m[1];
      if (t === 'else') return '"else" harus langsung mengikuti } dari blok if.';
      if (t === '{') return 'Ada { di tempat yang tidak terduga. Ingat: else tidak diberi kondisi (tulis "} else {"), dan kondisi if harus di dalam kurung ( ).';
      if (t === '=') return 'Tanda = di tempat yang salah. Di dalam object, pakai titik dua: judul: "...".';
      if (t === ',' || t === '<=' || t === '<') return 'Ada simbol di tempat yang salah. Di dalam for, bagian-bagiannya dipisah titik koma: for (let i = 1; i <= 5; i++).';
      if (t === ')') return 'Ada ) berlebih, atau ada yang kurang sebelum ).';
      if (t === '}') return 'Ada } berlebih atau salah tempat.';
      return `Simbol "${t}" muncul di tempat yang salah.`;
    }
    return null;
  }

  // Kumpulkan semua temuan untuk satu kali menjalankan kode.
  function collect(ctx, files) {
    const js = files.find((f) => f.name.endsWith('.js'))?.content || '';
    const jsLines = js.split('\n');
    const errors = (ctx.errors || []).map((e) => ({
      line: e.line,
      code: e.line ? (jsLines[e.line - 1] || '').trim() : '',
      msg: explainError(e.message, js) || e.message,
      raw: e.message.replace(/__LOOP_GUARD__:\d+/, 'perulangan dihentikan'),
    }));
    const warnings = [];
    for (const f of files) {
      const found = f.name.endsWith('.html') ? html(f.content)
        : f.name.endsWith('.css') ? css(f.content, ctx.doc)
          : f.name.endsWith('.js') ? jsStatic(f.content) : [];
      found.forEach((w) => warnings.push({ ...w, file: f.name }));
    }
    warnings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    // Jangan ulangi pesan yang sudah muncul sebagai error.
    const unique = warnings.filter((w) => !errors.some((e) => e.msg === w.msg));
    return { errors, warnings: unique };
  }

  return { normalizeQuotes, html, css, jsStatic, explainError, collect, openTagBefore, suggest, declaredNames };
})();
