// Data kursus. Setiap pelajaran berisi slide materi dan satu latihan.
// checks[].test  menerima { doc, win, logs, errors, code } dan mengembalikan true jika lulus.
// checks[].why   (opsional) mengembalikan penjelasan untuk pemula saat gagal.
// checks[].guard (opsional) pemeriksaan pengaman: tidak ditampilkan sebagai kriteria, hanya muncul saat gagal.
// hints memakai `backtick` untuk menandai kode.
const $ = (doc, sel) => doc.querySelector(sel);
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const text = (doc, sel) => norm($(doc, sel)?.textContent);
const style = (doc, sel, prop) => {
  const el = $(doc, sel);
  return el ? doc.defaultView.getComputedStyle(el)[prop] : '';
};
// Ambil variabel global peserta, termasuk yang dibuat dengan const/let.
const globalVar = (win, name) => {
  try { return win.eval(`typeof ${name} === "undefined" ? undefined : ${name}`); } catch { return undefined; }
};
// Panggil function peserta tanpa menampilkan output-nya di konsol.
const callSilently = (win, fn, ...args) => {
  win.__silent = true;
  try { return fn(...args); } finally { win.__silent = false; }
};
// Kode tanpa isi string, agar "nama" di dalam kutip tidak dianggap memakai variabel nama.
const codeOutsideStrings = (code) => code
  .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, (t) => (t.match(/\$\{[^}]*\}/g) || []).join(' '));
const isNumber = (s) => /^-?\d+(\.\d+)?$/.test(s);

// Teks sebuah elemen harus persis sama.
const expectText = (sel, label, expected) => ({
  desc: `Ada elemen ${label} berisi "${expected}" (huruf besar-kecil harus sama)`,
  test: ({ doc }) => text(doc, sel) === expected,
  why: ({ doc }) => {
    if (!$(doc, sel)) return `Belum ada elemen ${label}.`;
    const actual = text(doc, sel);
    if (!actual) return `Elemen ${label} masih kosong. Tulis teksnya di antara tag pembuka dan penutup.`;
    if (actual.toLowerCase() === expected.toLowerCase()) return `Huruf besar-kecil berbeda: tertulis "${actual}", seharusnya "${expected}".`;
    return `Teksnya "${actual}", seharusnya "${expected}".`;
  },
});

// Ada satu baris output console.log yang persis sama.
const NO_OUTPUT = (errors) => (errors?.length
  ? 'Belum ada output karena kode berhenti di error (lihat penjelasan merah di atas).'
  : 'Belum ada output. Gunakan console.log(...) untuk mencetak.');

const expectLog = (expected, extraWhy) => ({
  desc: `Mencetak ${isNumber(expected) ? expected : `"${expected}"`}`,
  test: ({ logs }) => logs.some((l) => norm(l) === expected),
  why: (ctx) => {
    const custom = extraWhy && extraWhy(ctx);
    if (custom) return custom;
    const { logs } = ctx;
    if (!logs.length) return NO_OUTPUT(ctx.errors);
    const lower = logs.find((l) => norm(l).toLowerCase() === expected.toLowerCase());
    if (lower) return `Huruf besar-kecil berbeda: tercetak "${lower}", seharusnya "${expected}".`;
    const contains = logs.find((l) => l.includes(expected));
    if (contains) return `Tercetak "${contains}". "${expected}" harus dicetak sendiri dengan satu console.log.`;
    return `Belum ada baris output "${expected}".`;
  },
});

// Gaya CSS yang dihitung browser harus sesuai.
const expectStyle = ({ sel, prop, value, computed, expected, desc }) => ({
  desc,
  test: ({ doc }) => {
    const v = style(doc, sel, computed);
    return typeof expected === 'function' ? expected(v) : v === expected;
  },
  why: ({ doc }) => ($(doc, sel)
    ? `Belum berlaku pada ${sel}. Yang dibutuhkan: ${sel} { ${prop}: ${value}; }`
    : `Elemen ${sel} tidak ditemukan. Jangan ubah index.html.`),
});

const COURSES = [
  {
    id: 'html',
    title: 'HTML Dasar',
    icon: '🧱',
    color: '#e44d26',
    description: 'Pelajari struktur halaman web: heading, paragraf, link, gambar, dan list.',
    lessons: [
      {
        title: 'Heading & Paragraf',
        slides: [
          {
            title: 'Apa itu HTML?',
            body: `<p>HTML adalah bahasa untuk menyusun <b>isi dan struktur</b> halaman web: judul, paragraf, gambar, dan sebagainya.</p>
<p>HTML ditulis dengan <b>tag</b>, yaitu nama elemen di dalam kurung sudut, contohnya <code>&lt;h1&gt;</code> untuk judul.</p>`,
          },
          {
            title: 'Tag pembuka & penutup',
            body: `<p>Sebagian besar tag punya <b>pembuka</b> dan <b>penutup</b>. Penutup sama dengan pembuka, tetapi diberi <b>garis miring</b> <code>/</code>:</p>
<pre>&lt;h1&gt;Ini Judul&lt;/h1&gt;
&lt;p&gt;Ini paragraf.&lt;/p&gt;</pre>
<p>Teks di antara pembuka dan penutup adalah isi elemen. <code>&lt;h1&gt;</code> sampai <code>&lt;h6&gt;</code> adalah judul (heading), <code>&lt;p&gt;</code> adalah paragraf.</p>`,
          },
          {
            title: 'Komentar & cara mengerjakan latihan',
            body: `<p>Baris seperti <code>&lt;!-- Tulis kode di bawah ini --&gt;</code> adalah <b>komentar</b>: catatan yang tidak ditampilkan. Tulis kodemu di baris baru <b>setelah</b> komentar.</p>
<p>Di latihan:</p>
<ol><li>Baca <b>Instruksi</b>.</li><li>Tulis kode di tab <b>Kode</b>. Tombol simbol di atas keyboard membantu mengetik <code>&lt; &gt; /</code>.</li><li>Tekan <b>▶ Jalankan</b> untuk melihat hasilnya di tab <b>Hasil</b>.</li><li>Tekan <b>Cek Jawaban</b>. Jika ada yang salah, penjelasannya muncul di tab Instruksi.</li></ol>`,
          },
        ],
        exercise: {
          instruction: `Buat sebuah <code>&lt;h1&gt;</code> berisi teks <b>Halo Dunia</b>, lalu di bawahnya sebuah <code>&lt;p&gt;</code> berisi teks apa saja.`,
          files: [{ name: 'index.html', content: '<!-- Tulis kode di bawah ini -->\n\n' }],
          hints: [
            'Judul utama memakai tag `h1`. Isinya ditulis di antara pembuka `<h1>` dan penutup `</h1>`.',
            'Baris pertama: `<h1>Halo Dunia</h1>` (huruf H dan D besar).',
            'Baris kedua: `<p>` + teks bebas + `</p>`, mis. `<p>Saya sedang belajar HTML.</p>`',
          ],
          solution: { 'index.html': '<!-- Tulis kode di bawah ini -->\n<h1>Halo Dunia</h1>\n<p>Saya sedang belajar HTML.</p>\n' },
          checks: [
            expectText('h1', '<h1>', 'Halo Dunia'),
            {
              desc: 'Ada elemen <p> yang tidak kosong',
              test: ({ doc }) => text(doc, 'p').length > 0,
              why: ({ doc }) => ($(doc, 'p') ? 'Elemen <p> masih kosong. Tulis teks di antara <p> dan </p>.' : 'Belum ada elemen <p>.'),
            },
          ],
        },
      },
      {
        title: 'Link & Gambar',
        slides: [
          {
            title: 'Membuat link',
            body: `<p>Link dibuat dengan tag <code>&lt;a&gt;</code>. Alamat tujuannya ditulis di <b>atribut</b> <code>href</code>:</p>
<pre>&lt;a href="https://example.com"&gt;Kunjungi&lt;/a&gt;</pre>
<p>Atribut ditulis di dalam tag pembuka dengan pola <code>nama="nilai"</code>: ada tanda <code>=</code> dan nilainya diapit tanda kutip.</p>`,
          },
          {
            title: 'Menampilkan gambar',
            body: `<p>Gambar memakai tag <code>&lt;img&gt;</code> yang <b>tidak punya tag penutup</b>:</p>
<pre>&lt;img src="https://picsum.photos/200" alt="Gambar acak"&gt;</pre>
<p><code>src</code> adalah alamat gambar. <code>alt</code> adalah deskripsi gambar untuk pembaca layar atau saat gambar gagal dimuat.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat link <code>&lt;a&gt;</code> menuju <b>https://developer.mozilla.org</b> dengan teks <b>MDN</b>. Lalu tambahkan <code>&lt;img&gt;</code> dengan atribut <code>src</code> dan <code>alt</code>. Untuk <code>src</code> kamu bisa memakai <b>https://picsum.photos/200</b>.`,
          files: [{ name: 'index.html', content: '<h1>Referensi Belajar</h1>\n\n' }],
          hints: [
            'Pola link: `<a href="ALAMAT">TEKS</a>`. Ganti ALAMAT dan TEKS sesuai instruksi.',
            '`<a href="https://developer.mozilla.org">MDN</a>`',
            'Gambar tidak punya penutup: `<img src="https://picsum.photos/200" alt="Gambar acak">`',
          ],
          solution: {
            'index.html': '<h1>Referensi Belajar</h1>\n<a href="https://developer.mozilla.org">MDN</a>\n<img src="https://picsum.photos/200" alt="Gambar acak">\n',
          },
          checks: [
            {
              desc: 'Link <a> menuju https://developer.mozilla.org',
              test: ({ doc }) => /^https:\/\/developer\.mozilla\.org\/?$/.test(($(doc, 'a')?.getAttribute('href') || '').trim()),
              why: ({ doc }) => {
                const a = $(doc, 'a');
                if (!a) return 'Belum ada elemen <a>.';
                const href = a.getAttribute('href');
                if (href == null) return 'Link belum punya atribut href. Tulis <a href="https://developer.mozilla.org">.';
                if (href.length > 45) return 'Alamat link tidak terbaca dengan benar. Periksa tanda kutip pada href (lihat peringatan kuning).';
                if (/^(www\.)?developer\.mozilla\.org/.test(href)) return `Tambahkan https:// di depan alamat: "https://${href.replace(/^www\./, '')}".`;
                return `Alamat link-nya "${href}", seharusnya "https://developer.mozilla.org".`;
              },
            },
            expectText('a', '<a>', 'MDN'),
            {
              desc: 'Ada <img> dengan atribut src',
              test: ({ doc }) => !!($(doc, 'img')?.getAttribute('src') || '').trim(),
              why: ({ doc }) => ($(doc, 'img') ? 'Tambahkan alamat gambar: src="https://picsum.photos/200".' : 'Belum ada elemen <img>.'),
            },
            {
              desc: '<img> punya atribut alt yang tidak kosong',
              test: ({ doc }) => !!($(doc, 'img')?.getAttribute('alt') || '').trim(),
              why: ({ doc }) => ($(doc, 'img') ? 'Tambahkan deskripsi gambar: alt="Gambar acak".' : 'Belum ada elemen <img>.'),
            },
          ],
        },
      },
      {
        title: 'List',
        slides: [
          {
            title: 'Unordered & ordered list',
            body: `<p><code>&lt;ul&gt;</code> membuat list berpoin, <code>&lt;ol&gt;</code> membuat list bernomor. Setiap item memakai <code>&lt;li&gt;</code> dan harus berada <b>di dalam</b> <code>&lt;ul&gt;</code> atau <code>&lt;ol&gt;</code>:</p>
<pre>&lt;ul&gt;
  &lt;li&gt;Apel&lt;/li&gt;
  &lt;li&gt;Jeruk&lt;/li&gt;
&lt;/ul&gt;</pre>
<p>Spasi di awal baris (indentasi) tidak wajib, tetapi membuat kode lebih mudah dibaca.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat <code>&lt;ul&gt;</code> berisi <b>minimal 3</b> item <code>&lt;li&gt;</code> tentang hobimu.`,
          files: [{ name: 'index.html', content: '<h2>Hobi Saya</h2>\n\n' }],
          hints: [
            'Buka dengan `<ul>` dan tutup dengan `</ul>`.',
            'Setiap hobi ditulis di antara `<li>` dan `</li>`, di dalam `<ul>`.',
            '`<ul>` `<li>Membaca</li>` `<li>Bersepeda</li>` `<li>Koding</li>` `</ul>`',
          ],
          solution: { 'index.html': '<h2>Hobi Saya</h2>\n<ul>\n  <li>Membaca</li>\n  <li>Bersepeda</li>\n  <li>Koding</li>\n</ul>\n' },
          checks: [
            {
              desc: 'Ada elemen <ul>',
              test: ({ doc }) => !!$(doc, 'ul'),
              why: ({ doc }) => ($(doc, 'ol') ? 'Kamu memakai <ol> (list bernomor). Latihan ini meminta <ul> (list berpoin).' : 'Belum ada elemen <ul>.'),
            },
            {
              desc: '<ul> berisi minimal 3 <li>',
              test: ({ doc }) => doc.querySelectorAll('ul > li').length >= 3,
              why: ({ doc }) => {
                const inside = doc.querySelectorAll('ul > li').length;
                const all = doc.querySelectorAll('li').length;
                if (all > inside) return '<li> harus berada di antara <ul> dan </ul>.';
                return `Baru ada ${inside} <li> di dalam <ul>, perlu minimal 3.`;
              },
            },
            {
              guard: true,
              desc: 'Tidak ada <li> yang kosong',
              test: ({ doc }) => [...doc.querySelectorAll('ul > li')].every((li) => li.textContent.trim()),
              why: () => 'Ada <li> yang kosong. Isi setiap item dengan teks.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'css',
    title: 'CSS Dasar',
    icon: '🎨',
    color: '#264de4',
    description: 'Hias halaman web dengan warna, ukuran font, class, dan Flexbox.',
    lessons: [
      {
        title: 'Selector & Warna',
        slides: [
          {
            title: 'Apa itu CSS?',
            body: `<p>CSS mengatur <b>tampilan</b> elemen HTML. Satu aturan CSS terdiri dari <b>selector</b> (elemen yang diatur), <b>properti</b>, dan <b>nilai</b>:</p>
<pre>h1 {
  color: red;
}</pre>
<p>Di latihan CSS, <code>index.html</code> sudah disiapkan. Kamu cukup menulis di tab <b>style.css</b>.</p>`,
          },
          {
            title: 'Aturan penulisan',
            body: `<ul>
<li>Properti ditulis di dalam kurung kurawal <code>{ }</code> milik selector.</li>
<li>Antara properti dan nilai ada <b>titik dua</b> <code>:</code></li>
<li>Setiap baris diakhiri <b>titik koma</b> <code>;</code></li>
<li>Nama warna memakai bahasa Inggris: <code>red</code>, <code>blue</code>, <code>lightyellow</code>.</li>
</ul>
<pre>body {
  background-color: lightyellow;
}</pre>`,
          },
        ],
        exercise: {
          instruction: `Di <code>style.css</code>, ubah warna teks <code>h1</code> menjadi <b>red</b> dan warna latar <code>body</code> menjadi <b>lightyellow</b>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<h1>Belajar CSS</h1>\n<p>CSS itu menyenangkan.</p>\n' },
            { name: 'style.css', content: '/* Tulis CSS di bawah ini */\n\n' },
          ],
          hints: [
            'Buat dua aturan: satu untuk `h1`, satu untuk `body`, masing-masing dengan `{ }` sendiri.',
            '`h1 { color: red; }`',
            '`body { background-color: lightyellow; }`',
          ],
          solution: { 'style.css': '/* Tulis CSS di bawah ini */\nh1 {\n  color: red;\n}\n\nbody {\n  background-color: lightyellow;\n}\n' },
          checks: [
            expectStyle({ sel: 'h1', prop: 'color', value: 'red', computed: 'color', expected: 'rgb(255, 0, 0)', desc: 'Teks h1 berwarna merah (color: red)' }),
            expectStyle({ sel: 'body', prop: 'background-color', value: 'lightyellow', computed: 'backgroundColor', expected: 'rgb(255, 255, 224)', desc: 'Latar body kuning muda (background-color: lightyellow)' }),
          ],
        },
      },
      {
        title: 'Ukuran Font & Class',
        slides: [
          {
            title: 'Selector class',
            body: `<p>Beri elemen sebuah <code>class</code> di HTML, lalu pilih di CSS dengan <b>titik</b> di depan namanya:</p>
<pre>&lt;p class="penting"&gt;...&lt;/p&gt;

.penting {
  font-size: 24px;
  font-weight: bold;
}</pre>
<p>Tanpa titik, CSS mencari tag bernama <code>&lt;penting&gt;</code>, yang tidak ada.</p>`,
          },
          {
            title: 'Satuan ukuran',
            body: `<p>Ukuran perlu <b>satuan</b>, ditulis menempel tanpa spasi: <code>24px</code>, bukan <code>24</code> atau <code>24 px</code>.</p>
<p><code>font-weight: bold</code> membuat teks tebal.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat aturan untuk class <code>.penting</code> dengan <code>font-size: 24px</code> dan <code>font-weight: bold</code>. Paragraf biasa jangan ikut berubah.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<p>Teks biasa.</p>\n<p class="penting">Teks penting!</p>\n' },
            { name: 'style.css', content: '\n' },
          ],
          hints: [
            'Selector class diawali titik: `.penting { ... }`',
            'Ukuran memakai satuan tanpa spasi: `font-size: 24px;`',
            'Teks tebal: `font-weight: bold;`',
          ],
          solution: { 'style.css': '.penting {\n  font-size: 24px;\n  font-weight: bold;\n}\n' },
          checks: [
            expectStyle({ sel: '.penting', prop: 'font-size', value: '24px', computed: 'fontSize', expected: '24px', desc: '.penting berukuran 24px' }),
            expectStyle({ sel: '.penting', prop: 'font-weight', value: 'bold', computed: 'fontWeight', expected: (v) => Number(v) >= 700, desc: '.penting bercetak tebal' }),
            {
              guard: true,
              desc: 'Paragraf biasa tidak ikut berubah',
              test: ({ doc }) => style(doc, 'p:not(.penting)', 'fontSize') !== '24px',
              why: () => 'Paragraf biasa ikut membesar. Pakai selector .penting, bukan p.',
            },
          ],
        },
      },
      {
        title: 'Box Model',
        slides: [
          {
            title: 'Padding, border, margin',
            body: `<p>Setiap elemen adalah kotak dengan lapisan:</p>
<ul><li><b>padding</b>: jarak di dalam garis tepi</li><li><b>border</b>: garis tepi</li><li><b>margin</b>: jarak di luar garis tepi</li></ul>
<pre>.kartu {
  padding: 16px;
  border: 2px solid black;
  border-radius: 8px;
}</pre>
<p><code>border</code> berisi tiga nilai sekaligus: tebal, gaya garis, dan warna. <code>border-radius</code> membuat sudut membulat.</p>`,
          },
        ],
        exercise: {
          instruction: `Beri <code>.kartu</code> <code>padding: 16px</code>, <code>border: 2px solid black</code>, dan <code>border-radius: 8px</code>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<div class="kartu">\n  <h3>Kartu Profil</h3>\n  <p>Halo, saya sedang belajar CSS.</p>\n</div>\n' },
            { name: 'style.css', content: '.kartu {\n\n}\n' },
          ],
          hints: [
            'Tulis ketiga properti di baris kosong di dalam `.kartu { }`, masing-masing diakhiri titik koma.',
            '`padding: 16px;` dan `border-radius: 8px;`',
            '`border: 2px solid black;`',
          ],
          solution: { 'style.css': '.kartu {\n  padding: 16px;\n  border: 2px solid black;\n  border-radius: 8px;\n}\n' },
          checks: [
            expectStyle({ sel: '.kartu', prop: 'padding', value: '16px', computed: 'paddingTop', expected: '16px', desc: 'padding 16px' }),
            {
              desc: 'border 2px solid',
              test: ({ doc }) => style(doc, '.kartu', 'borderTopStyle') === 'solid' && style(doc, '.kartu', 'borderTopWidth') === '2px',
              why: ({ doc }) => (style(doc, '.kartu', 'borderTopStyle') === 'solid'
                ? `Tebal border-nya ${style(doc, '.kartu', 'borderTopWidth')}, seharusnya 2px.`
                : 'Belum berlaku. Yang dibutuhkan: .kartu { border: 2px solid black; } (tebal, gaya garis, warna).'),
            },
            expectStyle({ sel: '.kartu', prop: 'border-radius', value: '8px', computed: 'borderTopLeftRadius', expected: '8px', desc: 'border-radius 8px' }),
          ],
        },
      },
      {
        title: 'Flexbox',
        slides: [
          {
            title: 'Menyusun elemen sebaris',
            body: `<p><code>display: flex</code> pada elemen <b>induk</b> membuat elemen di dalamnya tersusun sebaris:</p>
<pre>.menu {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}</pre>
<p><code>justify-content: space-between</code> membagi ruang kosong di antara isi; <code>gap</code> mengatur jarak antar-isi.</p>`,
          },
          {
            title: 'Responsif dengan flex-wrap',
            body: `<p><code>flex-wrap: wrap</code> membuat isi turun ke baris baru saat layar sempit, cocok untuk tampilan HP.</p>`,
          },
        ],
        exercise: {
          instruction: `Jadikan <code>.menu</code> sebuah flex container dengan <code>display: flex</code>, <code>justify-content: space-between</code>, <code>gap: 8px</code>, dan <code>flex-wrap: wrap</code>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<nav class="menu">\n  <a href="#">Beranda</a>\n  <a href="#">Kursus</a>\n  <a href="#">Kontak</a>\n</nav>\n' },
            { name: 'style.css', content: '.menu {\n\n}\n' },
          ],
          hints: [
            'Semua properti ditulis di dalam `.menu { }`.',
            '`display: flex;` membuat isi menu sebaris.',
            'Tambahkan `justify-content: space-between;`, `gap: 8px;`, dan `flex-wrap: wrap;`',
          ],
          solution: { 'style.css': '.menu {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n' },
          checks: [
            expectStyle({ sel: '.menu', prop: 'display', value: 'flex', computed: 'display', expected: 'flex', desc: 'display: flex' }),
            expectStyle({ sel: '.menu', prop: 'justify-content', value: 'space-between', computed: 'justifyContent', expected: 'space-between', desc: 'justify-content: space-between' }),
            expectStyle({ sel: '.menu', prop: 'gap', value: '8px', computed: 'columnGap', expected: '8px', desc: 'gap: 8px' }),
            expectStyle({ sel: '.menu', prop: 'flex-wrap', value: 'wrap', computed: 'flexWrap', expected: 'wrap', desc: 'flex-wrap: wrap' }),
          ],
        },
      },
    ],
  },
  {
    id: 'js',
    title: 'JavaScript Dasar',
    icon: '⚡',
    color: '#d4b106',
    description: 'Mulai memprogram: console.log, variabel, kondisi, dan perulangan.',
    lessons: [
      {
        title: 'console.log',
        slides: [
          {
            title: 'Menampilkan output',
            body: `<p><code>console.log()</code> mencetak nilai ke <b>konsol</b> (tab Hasil):</p>
<pre>console.log("Halo");   // Halo
console.log(3 + 4);    // 7
console.log("3 + 4");  // 3 + 4</pre>
<p><b>Teks</b> diapit tanda kutip. <b>Angka</b> dan perhitungan ditulis tanpa kutip agar dihitung.</p>`,
          },
          {
            title: 'Huruf besar-kecil & komentar',
            body: `<p>JavaScript membedakan huruf besar dan kecil: <code>console</code> benar, <code>Console</code> salah.</p>
<p>Tulisan setelah <code>//</code> adalah <b>komentar</b> dan tidak dijalankan. Tulis kodemu di baris baru.</p>`,
          },
        ],
        exercise: {
          instruction: `Cetak teks <b>Halo JavaScript</b>, lalu di baris berikutnya cetak hasil dari <b>12 * 3</b> (biarkan JavaScript yang menghitung).`,
          files: [{ name: 'script.js', content: '// Tulis kode di bawah ini\n\n' }],
          hints: [
            'Teks diapit tanda kutip: `console.log("Halo JavaScript");`',
            'Perhitungan ditulis tanpa kutip agar dihitung: `console.log(12 * 3);`',
          ],
          solution: { 'script.js': '// Tulis kode di bawah ini\nconsole.log("Halo JavaScript");\nconsole.log(12 * 3);\n' },
          checks: [
            expectLog('Halo JavaScript'),
            expectLog('36', ({ logs }) => (logs.some((l) => /^12\s*\*\s*3$/.test(l))
              ? 'Tercetak "12 * 3" sebagai teks karena diapit tanda kutip. Tulis tanpa kutip: console.log(12 * 3);'
              : null)),
            {
              desc: 'Menghitung dengan operator *',
              test: ({ code }) => /12\s*\*\s*3/.test(codeOutsideStrings(code['script.js'])),
              why: () => 'Tulis perhitungannya, bukan hasilnya: console.log(12 * 3);',
            },
          ],
        },
      },
      {
        title: 'Variabel',
        slides: [
          {
            title: 'let & const',
            body: `<p>Variabel menyimpan nilai dengan sebuah nama. Gunakan <code>const</code> untuk nilai tetap dan <code>let</code> untuk nilai yang bisa berubah:</p>
<pre>const nama = "Budi";
let umur = 20;
umur = umur + 1;</pre>`,
          },
          {
            title: 'Menggabungkan teks',
            body: `<p>Tanda <code>+</code> menggabungkan teks dengan variabel. Spasi di dalam kutip ikut tercetak:</p>
<pre>console.log("Halo " + nama);  // Halo Budi
console.log("Halo" + nama);   // HaloBudi</pre>
<p>Nama variabel ditulis <b>tanpa</b> kutip. <code>"nama"</code> adalah teks biasa, sedangkan <code>nama</code> adalah variabel.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat konstanta <code>nama</code> berisi namamu, lalu cetak <b>Nama saya [namamu]</b> dengan menggabungkan teks dan variabel <code>nama</code>.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: [
            'Buat konstanta: `const nama = "Ani";` (ganti Ani dengan namamu).',
            'Gabungkan dengan `+`. Spasi setelah "saya" harus berada di dalam kutip.',
            '`console.log("Nama saya " + nama);`',
          ],
          solution: { 'script.js': 'const nama = "Ani";\nconsole.log("Nama saya " + nama);\n' },
          checks: [
            {
              desc: 'Ada konstanta nama berisi teks',
              test: ({ win, code }) => /\bconst\s+nama\s*=/.test(code['script.js']) && typeof globalVar(win, 'nama') === 'string',
              why: ({ win, code }) => {
                const js = code['script.js'];
                if (/\b(let|var)\s+nama\s*=/.test(js)) return 'Latihan ini meminta konstanta, jadi pakai const, bukan let.';
                const other = Lint.declaredNames(js).find((n) => n !== 'nama' && n.toLowerCase() === 'nama');
                if (other) return `Nama variabelmu "${other}", seharusnya "nama" (huruf kecil semua).`;
                if (/\bconst\s+nama\s*=/.test(js)) return `Isi nama harus teks dalam tanda kutip, mis. const nama = "Ani"; (sekarang: ${typeof globalVar(win, 'nama')}).`;
                return 'Belum ada const nama = "...";';
              },
            },
            {
              desc: 'Mencetak "Nama saya [namamu]"',
              test: ({ win, logs }) => {
                const nama = globalVar(win, 'nama');
                return typeof nama === 'string' && logs.some((l) => norm(l) === norm(`Nama saya ${nama}`));
              },
              why: ({ win, logs, errors }) => {
                const nama = globalVar(win, 'nama');
                if (!logs.length) return NO_OUTPUT(errors);
                if (logs.some((l) => /^Nama saya\S/.test(l))) return `Tercetak "${logs.find((l) => /^Nama saya\S/.test(l))}". Tambahkan spasi di dalam kutip: "Nama saya " + nama`;
                if (logs.some((l) => /^Nama saya nama$/.test(l))) return 'Tercetak kata "nama", bukan isinya. Tulis variabel di luar kutip: "Nama saya " + nama';
                if (logs.some((l) => /^nama saya/i.test(l))) return `Huruf besar-kecil berbeda: tercetak "${logs.find((l) => /^nama saya/i.test(l))}", seharusnya diawali "Nama saya".`;
                return `Tercetak "${logs[0]}", seharusnya "Nama saya ${nama ?? '...'}".`;
              },
            },
            {
              desc: 'console.log memakai variabel nama',
              test: ({ code }) => /console\.log\([^;]*\bnama\b/.test(codeOutsideStrings(code['script.js'])),
              why: () => 'Gunakan variabel nama di dalam console.log, jangan tulis namamu langsung atau di dalam kutip.',
            },
          ],
        },
      },
      {
        title: 'Kondisi if',
        slides: [
          {
            title: 'if / else',
            body: `<p><code>if</code> menjalankan kode hanya jika kondisinya benar. <code>else</code> dijalankan jika kondisinya salah:</p>
<pre>const nilai = 80;
if (nilai >= 75) {
  console.log("Lulus");
} else {
  console.log("Remedial");
}</pre>
<p><code>else</code> tidak diberi kondisi; cukup tulis <code>} else {</code>.</p>`,
          },
          {
            title: 'Operator perbandingan',
            body: `<ul>
<li><code>&gt;</code> lebih dari, <code>&lt;</code> kurang dari</li>
<li><code>&gt;=</code> lebih dari atau sama dengan, <code>&lt;=</code> kurang dari atau sama dengan</li>
<li><code>===</code> sama dengan (tiga tanda =)</li>
</ul>`,
          },
        ],
        exercise: {
          instruction: `Variabel <code>suhu</code> sudah disediakan. Jika <code>suhu</code> lebih dari 30, cetak <b>Panas</b>; selain itu cetak <b>Sejuk</b>. Kode akan diuji juga dengan suhu lain.`,
          files: [{ name: 'script.js', content: 'const suhu = 33;\n\n' }],
          hints: [
            'Bentuknya: `if (kondisi) { ... } else { ... }`',
            'Kondisinya: `suhu > 30`',
            '`console.log("Panas");` di dalam blok if, dan `console.log("Sejuk");` di dalam blok else.',
          ],
          solution: { 'script.js': 'const suhu = 33;\n\nif (suhu > 30) {\n  console.log("Panas");\n} else {\n  console.log("Sejuk");\n}\n' },
          checks: [
            {
              desc: 'Menggunakan if dan else',
              test: ({ code }) => /\bif\s*\(/.test(code['script.js']) && /\belse\b/.test(code['script.js']),
              why: ({ code }) => (/\bif\s*\(/.test(code['script.js']) ? 'Belum ada else untuk mencetak "Sejuk".' : 'Belum ada if (...).'),
            },
            {
              desc: 'Untuk suhu 33 mencetak "Panas" saja',
              test: ({ logs }) => logs.length === 1 && logs[0] === 'Panas',
              why: ({ logs, errors }) => {
                if (!logs.length) return NO_OUTPUT(errors);
                if (logs.includes('Panas') && logs.includes('Sejuk')) return 'Tercetak "Panas" dan "Sejuk". Pastikan console.log("Sejuk") berada di dalam blok else { }.';
                if (logs[0] === 'Sejuk') return 'Tercetak "Sejuk", padahal 33 lebih dari 30. Periksa kondisi if-nya.';
                if (logs.some((l) => l.toLowerCase() === 'panas')) return 'Huruf besar-kecil berbeda: seharusnya "Panas".';
                return `Tercetak: ${logs.join(', ')}. Seharusnya hanya "Panas".`;
              },
            },
            {
              desc: 'Untuk suhu 25 mencetak "Sejuk" saja',
              test: ({ win, code }) => {
                const js = code['script.js'].replace(/(\b(?:const|let|var)\s+suhu\s*=\s*)33\b/, '$125');
                const logs = js === code['script.js'] ? null : Runner.rerun(win, js);
                return !!logs && logs.length === 1 && logs[0] === 'Sejuk';
              },
              why: ({ win, code }) => {
                const js = code['script.js'].replace(/(\b(?:const|let|var)\s+suhu\s*=\s*)33\b/, '$125');
                if (js === code['script.js']) return 'Biarkan baris const suhu = 33; seperti semula.';
                const logs = Runner.rerun(win, js);
                if (!logs) return 'Kode error saat diuji dengan suhu 25.';
                return `Saat suhu diganti 25, tercetak: ${logs.length ? logs.map((l) => `"${l}"`).join(', ') : '(tidak ada)'}. Seharusnya hanya "Sejuk". Pastikan kondisinya memakai suhu > 30.`;
              },
            },
          ],
        },
      },
      {
        title: 'Perulangan for',
        slides: [
          {
            title: 'for loop',
            body: `<p><code>for</code> mengulang kode beberapa kali:</p>
<pre>for (let i = 1; i <= 3; i++) {
  console.log(i);
}
// 1
// 2
// 3</pre>
<p>Tiga bagian di dalam kurung dipisah <b>titik koma</b>:</p>
<ol><li><code>let i = 1</code>: mulai dari 1</li><li><code>i &lt;= 3</code>: ulangi selama i paling besar 3</li><li><code>i++</code>: tambah i satu setiap putaran</li></ol>`,
          },
          {
            title: 'Hati-hati perulangan tanpa akhir',
            body: `<p>Jika kondisinya tidak pernah salah, misalnya <code>i--</code> padahal seharusnya <code>i++</code>, perulangan tidak akan berhenti. Aplikasi ini akan menghentikannya dan memberi tahu baris mana yang bermasalah.</p>`,
          },
        ],
        exercise: {
          instruction: `Gunakan <code>for</code> untuk mencetak angka <b>1 sampai 5</b>, satu angka per baris.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: [
            'Mulai dari 1, ulangi selama i paling besar 5, naik satu-satu: `for (let i = 1; i <= 5; i++)`',
            'Di dalam `{ }` cetak nilai i: `console.log(i);`',
          ],
          solution: { 'script.js': 'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n' },
          checks: [
            {
              desc: 'Menggunakan for',
              test: ({ code }) => /\bfor\s*\(/.test(code['script.js']),
              why: () => 'Belum ada for (...).',
            },
            {
              desc: 'Mencetak 1, 2, 3, 4, 5 berurutan (satu per baris)',
              test: ({ logs }) => logs.join(',') === '1,2,3,4,5',
              why: ({ logs, errors }) => {
                const out = logs.join(',');
                if (errors.some((e) => e.message.includes('__LOOP_GUARD__'))) return 'Perulangannya tidak pernah berhenti (lihat penjelasan merah di atas).';
                if (!logs.length) return errors.length ? NO_OUTPUT(errors) : 'Belum ada output. Tulis console.log(i); di dalam { } perulangan.';
                if (out.startsWith('0,')) return `Tercetak ${logs.join(', ')}. Perulangan dimulai dari 0; mulai dari let i = 1.`;
                if (out === '1,2,3,4') return 'Angka 5 belum tercetak. Pakai i <= 5 (kurang dari atau sama dengan).';
                if (logs.length === 1) return `Tercetak "${logs[0]}" dalam satu baris. Letakkan console.log(i) di dalam perulangan agar tiap angka tercetak sendiri.`;
                if (logs.length > 5) return `Tercetak ${logs.length} baris. Periksa batas perulangan: i <= 5.`;
                return `Tercetak ${logs.join(', ')}. Seharusnya 1, 2, 3, 4, 5.`;
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 'js2',
    title: 'JavaScript Lanjutan',
    icon: '🧩',
    color: '#7c3aed',
    description: 'Function, array, object, lalu membuat halaman interaktif dengan DOM dan event.',
    lessons: [
      {
        title: 'Function',
        slides: [
          {
            title: 'Membungkus langkah dalam function',
            body: `<p>Function adalah kumpulan langkah yang diberi nama dan bisa dipakai berulang:</p>
<pre>function tambah(a, b) {
  return a + b;
}
console.log(tambah(2, 3)); // 5</pre>
<p><code>a</code> dan <code>b</code> adalah <b>parameter</b>: nilai yang dikirim saat function dipanggil.</p>`,
          },
          {
            title: 'return vs console.log',
            body: `<p><code>return</code> <b>mengembalikan</b> hasil ke bagian kode yang memanggil, sehingga hasilnya bisa disimpan atau dicetak. <code>console.log</code> hanya menampilkan ke layar.</p>
<p>Function tanpa <code>return</code> menghasilkan <code>undefined</code>.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat <code>function luasPersegi(sisi)</code> yang <b>mengembalikan</b> (return) sisi × sisi. Lalu cetak hasil <code>luasPersegi(4)</code>.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: [
            'Bentuknya: `function luasPersegi(sisi) { ... }` (huruf P besar).',
            'Di dalam function: `return sisi * sisi;`',
            'Di luar function, panggil dan cetak: `console.log(luasPersegi(4));`',
          ],
          solution: { 'script.js': 'function luasPersegi(sisi) {\n  return sisi * sisi;\n}\n\nconsole.log(luasPersegi(4));\n' },
          checks: [
            {
              desc: 'Ada function luasPersegi',
              test: ({ win }) => typeof globalVar(win, 'luasPersegi') === 'function',
              why: ({ code }) => {
                const other = Lint.declaredNames(code['script.js']).find((n) => n !== 'luasPersegi' && n.toLowerCase() === 'luaspersegi');
                return other ? `Nama function-mu "${other}", seharusnya "luasPersegi" (P besar).` : 'Belum ada function luasPersegi.';
              },
            },
            {
              desc: 'luasPersegi(5) mengembalikan 25',
              test: ({ win }) => callSilently(win, globalVar(win, 'luasPersegi'), 5) === 25,
              why: ({ win }) => {
                const r = callSilently(win, globalVar(win, 'luasPersegi'), 5);
                if (r === undefined) return 'Function-mu belum mengembalikan nilai (hasilnya undefined). Tambahkan return sisi * sisi; di dalam function.';
                return `luasPersegi(5) menghasilkan ${JSON.stringify(r)}, seharusnya 25.`;
              },
            },
            expectLog('16'),
          ],
        },
      },
      {
        title: 'Array',
        slides: [
          {
            title: 'Menyimpan banyak nilai',
            body: `<p>Array menyimpan daftar nilai berurutan. Indeks dimulai dari 0:</p>
<pre>const buah = ["apel", "jeruk"];
buah.push("mangga");
console.log(buah[0]);      // apel
console.log(buah.length);  // 3</pre>`,
          },
          {
            title: 'Menjumlahkan isi array',
            body: `<p><code>for...of</code> mengambil setiap elemen satu per satu:</p>
<pre>let total = 0;
for (const n of [1, 2, 3]) {
  total += n;
}
console.log(total); // 6</pre>
<ul><li><code>let total = 0</code> dibuat <b>sebelum</b> perulangan sebagai nilai awal.</li>
<li><code>total += n</code> sama dengan <code>total = total + n</code>.</li>
<li><code>console.log(total)</code> ditulis <b>setelah</b> perulangan selesai.</li></ul>`,
          },
        ],
        exercise: {
          instruction: `Hitung <b>total</b> semua isi array <code>nilai</code> dengan perulangan, lalu cetak totalnya.`,
          files: [{ name: 'script.js', content: 'const nilai = [80, 65, 90, 72];\n\n' }],
          hints: [
            'Siapkan wadah sebelum perulangan: `let total = 0;`',
            'Tambahkan setiap nilai: `for (const n of nilai) { total += n; }`',
            'Setelah perulangan selesai: `console.log(total);`',
          ],
          solution: { 'script.js': 'const nilai = [80, 65, 90, 72];\n\nlet total = 0;\nfor (const n of nilai) {\n  total += n;\n}\nconsole.log(total);\n' },
          checks: [
            {
              desc: 'Menggunakan perulangan',
              test: ({ code }) => /\bfor\s*\(|\bwhile\s*\(|\.reduce\(|\.forEach\(/.test(code['script.js']),
              why: () => 'Jumlahkan dengan perulangan (for), jangan dihitung manual.',
            },
            expectLog('307', ({ logs }) => {
              if (logs.includes('NaN')) return 'Tercetak NaN (bukan angka) karena total belum punya nilai awal. Tulis let total = 0; sebelum perulangan.';
              if (logs.includes('0')) return 'Tercetak 0. Pastikan total += n; berada di dalam { } perulangan.';
              if (['80', '65', '90', '72'].every((v) => logs.includes(v))) return 'Kamu mencetak tiap nilai. Jumlahkan ke total di dalam perulangan, lalu cetak total sekali setelah perulangan.';
              return null;
            }),
            {
              guard: true,
              desc: 'Tidak menulis 307 secara langsung',
              test: ({ code }) => !/307/.test(code['script.js']),
              why: () => 'Jangan tulis 307 langsung; biarkan perulangan yang menghitung.',
            },
          ],
        },
      },
      {
        title: 'Object',
        slides: [
          {
            title: 'Data dengan nama',
            body: `<p>Object menyimpan pasangan <b>kunci: nilai</b> di dalam kurung kurawal:</p>
<pre>const siswa = {
  nama: "Rina",
  kelas: 10,
};
console.log(siswa.nama); // Rina</pre>
<ul><li>Kunci dan nilai dipisah <b>titik dua</b> <code>:</code>, bukan <code>=</code>.</li>
<li>Antar-pasangan dipisah <b>koma</b>.</li>
<li>Teks pakai kutip, angka tanpa kutip.</li></ul>`,
          },
        ],
        exercise: {
          instruction: `Buat object <code>buku</code> dengan properti <code>judul</code> (teks), <code>penulis</code> (teks), dan <code>tahun</code> (angka). Lalu cetak <code>buku.judul</code>.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: [
            'Mulai dengan `const buku = {` dan akhiri dengan `};`',
            'Isinya: `judul: "Laskar Pelangi",` `penulis: "Andrea Hirata",` `tahun: 2005`',
            'Cetak: `console.log(buku.judul);`',
          ],
          solution: { 'script.js': 'const buku = {\n  judul: "Laskar Pelangi",\n  penulis: "Andrea Hirata",\n  tahun: 2005,\n};\n\nconsole.log(buku.judul);\n' },
          checks: [
            {
              desc: 'Ada object buku',
              test: ({ win }) => { const b = globalVar(win, 'buku'); return typeof b === 'object' && b !== null; },
              why: ({ code, errors }) => {
                const other = Lint.declaredNames(code['script.js']).find((n) => n !== 'buku' && n.toLowerCase() === 'buku');
                if (other) return `Nama variabelmu "${other}", seharusnya "buku" (huruf kecil).`;
                return errors.length ? 'Object buku belum terbentuk karena kode error (lihat penjelasan merah di atas).' : 'Belum ada const buku = { ... };';
              },
            },
            {
              desc: 'judul dan penulis berisi teks',
              test: ({ win }) => { const b = globalVar(win, 'buku'); return typeof b?.judul === 'string' && typeof b?.penulis === 'string'; },
              why: ({ win, errors }) => {
                const b = globalVar(win, 'buku');
                if (!b) return errors.length ? 'Belum bisa diperiksa karena kode error.' : 'Buat object buku dulu.';
                const missing = ['judul', 'penulis'].filter((k) => !(k in b));
                if (missing.length) return `Properti ${missing.join(' dan ')} belum ada (perhatikan ejaan dan huruf kecil).`;
                return 'Isi judul dan penulis harus teks dalam tanda kutip.';
              },
            },
            {
              desc: 'tahun berisi angka',
              test: ({ win }) => typeof globalVar(win, 'buku')?.tahun === 'number',
              why: ({ win, errors }) => {
                const b = globalVar(win, 'buku');
                if (!b) return errors.length ? 'Belum bisa diperiksa karena kode error.' : 'Buat object buku dulu.';
                const t = b.tahun;
                if (t === undefined) return 'Properti tahun belum ada.';
                if (typeof t === 'string') return `tahun berisi teks "${t}". Tulis angkanya tanpa tanda kutip: tahun: ${t.replace(/\D/g, '') || 2005}`;
                return 'tahun harus berupa angka, mis. tahun: 2005';
              },
            },
            {
              desc: 'Mencetak buku.judul',
              test: ({ win, logs, code }) => {
                const b = globalVar(win, 'buku');
                return !!b && logs.includes(String(b.judul)) && /buku\s*(\.\s*judul|\[\s*["']judul["']\s*\])/.test(code['script.js']);
              },
              why: ({ win, logs, errors }) => {
                const b = globalVar(win, 'buku');
                if (!logs.length) return errors.length ? NO_OUTPUT(errors) : 'Belum ada output. Tulis console.log(buku.judul);';
                if (b && logs.some((l) => l.startsWith('{'))) return 'Kamu mencetak seluruh object. Cetak judulnya saja: console.log(buku.judul);';
                return 'Ambil judul dari object dengan buku.judul, jangan tulis judulnya langsung.';
              },
            },
          ],
        },
      },
      {
        title: 'DOM & Event',
        slides: [
          {
            title: 'Mengambil elemen',
            body: `<p>JavaScript bisa mengubah halaman lewat <b>DOM</b>. Ambil elemen berdasarkan <code>id</code>-nya, lalu ubah teksnya:</p>
<pre>const judul = document.getElementById("judul");
judul.textContent = "Teks baru";</pre>
<p>Id harus sama persis dengan di HTML, termasuk huruf besar-kecil.</p>`,
          },
          {
            title: 'Bereaksi pada klik',
            body: `<p><code>addEventListener</code> menjalankan sebuah function <b>saat</b> event terjadi, bukan langsung:</p>
<pre>tombol.addEventListener("click", function () {
  console.log("diklik");
});</pre>
<p>Nama event ditulis huruf kecil tanpa "on": <code>"click"</code>.</p>`,
          },
        ],
        exercise: {
          instruction: `Variabel <code>tombol</code> dan <code>hasil</code> sudah disiapkan. Buat agar saat tombol diklik, teks <code>hasil</code> berubah menjadi <b>Diklik!</b>. Setelah itu coba klik tombolnya di bagian Hasil.`,
          files: [
            { name: 'index.html', content: '<button id="tombol">Klik saya</button>\n<p id="hasil">Belum diklik</p>\n<script src="script.js"></script>\n' },
            { name: 'script.js', content: 'const tombol = document.getElementById("tombol");\nconst hasil = document.getElementById("hasil");\n\n' },
          ],
          hints: [
            'Pasang pendengar klik: `tombol.addEventListener("click", function () { ... });`',
            'Di dalam function: `hasil.textContent = "Diklik!";`',
          ],
          solution: { 'script.js': 'const tombol = document.getElementById("tombol");\nconst hasil = document.getElementById("hasil");\n\ntombol.addEventListener("click", function () {\n  hasil.textContent = "Diklik!";\n});\n' },
          checks: [
            {
              desc: 'Menangani klik tombol (addEventListener atau onclick)',
              test: ({ code }) => /addEventListener\(\s*["']click["']|\.onclick\s*=/.test(code['script.js']),
              why: ({ code }) => {
                const ev = /addEventListener\(\s*["']([^"']*)["']/.exec(code['script.js']);
                if (ev) return `Nama event "${ev[1]}" tidak dikenal. Tulis "click" (huruf kecil, tanpa "on").`;
                return 'Belum ada kode yang menangani klik. Gunakan tombol.addEventListener("click", function () { ... });';
              },
            },
            {
              guard: true,
              desc: 'Teks awal tidak berubah sebelum diklik',
              test: ({ doc }) => text(doc, '#hasil') === 'Belum diklik',
              why: () => 'Teks sudah berubah sebelum tombol diklik. Pindahkan hasil.textContent = "Diklik!"; ke dalam function di addEventListener.',
            },
            {
              desc: 'Setelah diklik, hasil berisi "Diklik!"',
              test: ({ doc }) => { $(doc, '#tombol').click(); return text(doc, '#hasil') === 'Diklik!'; },
              why: ({ doc }) => {
                const t = text(doc, '#hasil');
                if (t === 'Belum diklik') return 'Setelah diklik, teks belum berubah. Pastikan hasil.textContent = "Diklik!"; ada di dalam function klik.';
                if (t.toLowerCase() === 'diklik!') return `Huruf besar-kecil berbeda: "${t}", seharusnya "Diklik!".`;
                return `Setelah diklik, teksnya "${t}", seharusnya "Diklik!".`;
              },
            },
          ],
        },
      },
    ],
  },
];
