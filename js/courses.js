// Data kursus. Setiap pelajaran berisi slide materi dan satu latihan.
// checks[].test menerima { doc, win, logs, code } dan mengembalikan true jika lulus.
const $ = (doc, sel) => doc.querySelector(sel);
const text = (doc, sel) => ($(doc, sel)?.textContent || '').trim();
const style = (doc, sel, prop) => {
  const el = $(doc, sel);
  return el ? doc.defaultView.getComputedStyle(el)[prop] : '';
};

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
            body: `<p>HTML (HyperText Markup Language) adalah bahasa untuk menyusun <b>struktur</b> halaman web.</p>
<p>HTML ditulis dengan <b>tag</b>, contohnya <code>&lt;h1&gt;</code> untuk judul.</p>`,
          },
          {
            title: 'Tag pembuka & penutup',
            body: `<p>Sebagian besar tag punya pembuka dan penutup:</p>
<pre>&lt;h1&gt;Ini Judul&lt;/h1&gt;
&lt;p&gt;Ini paragraf.&lt;/p&gt;</pre>
<p><code>&lt;h1&gt;</code> sampai <code>&lt;h6&gt;</code> adalah heading, <code>&lt;p&gt;</code> adalah paragraf.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat sebuah <code>&lt;h1&gt;</code> berisi teks <b>Halo Dunia</b>, lalu di bawahnya sebuah <code>&lt;p&gt;</code> berisi teks apa saja.`,
          files: [{ name: 'index.html', content: '<!-- Tulis kode di bawah ini -->\n\n' }],
          hints: ['Tulis <h1>Halo Dunia</h1>', 'Paragraf ditulis dengan <p>...</p>'],
          solution: { 'index.html': '<h1>Halo Dunia</h1>\n<p>Saya sedang belajar HTML.</p>\n' },
          checks: [
            { desc: 'Ada elemen <h1> berisi "Halo Dunia"', test: ({ doc }) => text(doc, 'h1') === 'Halo Dunia' },
            { desc: 'Ada elemen <p> yang tidak kosong', test: ({ doc }) => text(doc, 'p').length > 0 },
          ],
        },
      },
      {
        title: 'Link & Gambar',
        slides: [
          {
            title: 'Membuat link',
            body: `<p>Link dibuat dengan tag <code>&lt;a&gt;</code> dan atribut <code>href</code>:</p>
<pre>&lt;a href="https://example.com"&gt;Kunjungi&lt;/a&gt;</pre>`,
          },
          {
            title: 'Menampilkan gambar',
            body: `<p>Gambar memakai tag <code>&lt;img&gt;</code> yang <b>tidak punya tag penutup</b>:</p>
<pre>&lt;img src="foto.png" alt="Deskripsi"&gt;</pre>
<p><code>alt</code> penting untuk aksesibilitas.</p>`,
          },
        ],
        exercise: {
          instruction: `Buat link <code>&lt;a&gt;</code> menuju <b>https://developer.mozilla.org</b> dengan teks <b>MDN</b>. Lalu tambahkan <code>&lt;img&gt;</code> dengan atribut <code>src</code> dan <code>alt</code> (bebas).`,
          files: [{ name: 'index.html', content: '<h1>Referensi Belajar</h1>\n\n' }],
          hints: ['<a href="https://developer.mozilla.org">MDN</a>', '<img src="https://picsum.photos/200" alt="Gambar acak">'],
          solution: {
            'index.html': '<h1>Referensi Belajar</h1>\n<a href="https://developer.mozilla.org">MDN</a>\n<img src="https://picsum.photos/200" alt="Gambar acak">\n',
          },
          checks: [
            { desc: 'Link menuju https://developer.mozilla.org', test: ({ doc }) => /^https:\/\/developer\.mozilla\.org\/?$/.test($(doc, 'a')?.getAttribute('href') || '') },
            { desc: 'Teks link adalah "MDN"', test: ({ doc }) => text(doc, 'a') === 'MDN' },
            { desc: 'Ada <img> dengan src dan alt', test: ({ doc }) => !!$(doc, 'img[src][alt]') && $(doc, 'img').getAttribute('alt').trim() !== '' },
          ],
        },
      },
      {
        title: 'List',
        slides: [
          {
            title: 'Unordered & ordered list',
            body: `<p><code>&lt;ul&gt;</code> membuat list berpoin, <code>&lt;ol&gt;</code> list bernomor. Setiap item memakai <code>&lt;li&gt;</code>:</p>
<pre>&lt;ul&gt;
  &lt;li&gt;Apel&lt;/li&gt;
  &lt;li&gt;Jeruk&lt;/li&gt;
&lt;/ul&gt;</pre>`,
          },
        ],
        exercise: {
          instruction: `Buat <code>&lt;ul&gt;</code> berisi <b>minimal 3</b> item <code>&lt;li&gt;</code> tentang hobimu.`,
          files: [{ name: 'index.html', content: '<h2>Hobi Saya</h2>\n\n' }],
          hints: ['Bungkus semua <li> di dalam <ul>...</ul>'],
          solution: { 'index.html': '<h2>Hobi Saya</h2>\n<ul>\n  <li>Membaca</li>\n  <li>Bersepeda</li>\n  <li>Koding</li>\n</ul>\n' },
          checks: [
            { desc: 'Ada elemen <ul>', test: ({ doc }) => !!$(doc, 'ul') },
            { desc: '<ul> berisi minimal 3 <li>', test: ({ doc }) => doc.querySelectorAll('ul > li').length >= 3 },
            { desc: 'Tidak ada <li> kosong', test: ({ doc }) => [...doc.querySelectorAll('ul > li')].every((li) => li.textContent.trim()) },
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
    description: 'Hias halaman web dengan warna, ukuran font, dan class.',
    lessons: [
      {
        title: 'Selector & Warna',
        slides: [
          {
            title: 'Apa itu CSS?',
            body: `<p>CSS mengatur <b>tampilan</b> elemen HTML. Aturan CSS terdiri dari <b>selector</b>, <b>properti</b>, dan <b>nilai</b>:</p>
<pre>h1 {
  color: red;
}</pre>`,
          },
        ],
        exercise: {
          instruction: `Di <code>style.css</code>, ubah warna teks <code>h1</code> menjadi <b>red</b> dan warna latar <code>body</code> menjadi <b>lightyellow</b>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<h1>Belajar CSS</h1>\n<p>CSS itu menyenangkan.</p>\n' },
            { name: 'style.css', content: '/* Tulis CSS di sini */\n\n' },
          ],
          hints: ['h1 { color: red; }', 'body { background-color: lightyellow; }'],
          solution: { 'style.css': 'h1 {\n  color: red;\n}\n\nbody {\n  background-color: lightyellow;\n}\n' },
          checks: [
            { desc: 'Warna h1 adalah red', test: ({ doc }) => style(doc, 'h1', 'color') === 'rgb(255, 0, 0)' },
            { desc: 'Latar body adalah lightyellow', test: ({ doc }) => style(doc, 'body', 'backgroundColor') === 'rgb(255, 255, 224)' },
          ],
        },
      },
      {
        title: 'Ukuran Font & Class',
        slides: [
          {
            title: 'Selector class',
            body: `<p>Beri elemen sebuah <code>class</code> lalu pilih dengan titik (<code>.</code>):</p>
<pre>&lt;p class="penting"&gt;...&lt;/p&gt;

.penting {
  font-size: 24px;
}</pre>`,
          },
        ],
        exercise: {
          instruction: `Buat aturan untuk class <code>.penting</code> dengan <code>font-size: 24px</code> dan <code>font-weight: bold</code>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<p>Teks biasa.</p>\n<p class="penting">Teks penting!</p>\n' },
            { name: 'style.css', content: '\n' },
          ],
          hints: ['Selector class diawali titik: .penting { ... }'],
          solution: { 'style.css': '.penting {\n  font-size: 24px;\n  font-weight: bold;\n}\n' },
          checks: [
            { desc: '.penting berukuran 24px', test: ({ doc }) => style(doc, '.penting', 'fontSize') === '24px' },
            { desc: '.penting bercetak tebal', test: ({ doc }) => Number(style(doc, '.penting', 'fontWeight')) >= 700 },
            { desc: 'Paragraf biasa tidak ikut berubah', test: ({ doc }) => style(doc, 'p:not(.penting)', 'fontSize') !== '24px' },
          ],
        },
      },
      {
        title: 'Box Model',
        slides: [
          {
            title: 'Padding, border, margin',
            body: `<p>Setiap elemen adalah kotak dengan lapisan:</p>
<ul><li><b>padding</b>: jarak di dalam border</li><li><b>border</b>: garis tepi</li><li><b>margin</b>: jarak di luar border</li></ul>
<pre>.kartu {
  padding: 16px;
  border: 2px solid black;
  margin: 20px;
}</pre>`,
          },
        ],
        exercise: {
          instruction: `Beri <code>.kartu</code> <code>padding: 16px</code>, <code>border: 2px solid black</code>, dan <code>border-radius: 8px</code>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<div class="kartu">\n  <h3>Kartu Profil</h3>\n  <p>Halo, saya sedang belajar CSS.</p>\n</div>\n' },
            { name: 'style.css', content: '.kartu {\n\n}\n' },
          ],
          hints: ['Tulis ketiga properti di dalam kurung kurawal .kartu { }'],
          solution: { 'style.css': '.kartu {\n  padding: 16px;\n  border: 2px solid black;\n  border-radius: 8px;\n}\n' },
          checks: [
            { desc: 'padding 16px', test: ({ doc }) => style(doc, '.kartu', 'paddingTop') === '16px' },
            { desc: 'border 2px solid', test: ({ doc }) => style(doc, '.kartu', 'borderTopWidth') === '2px' && style(doc, '.kartu', 'borderTopStyle') === 'solid' },
            { desc: 'border-radius 8px', test: ({ doc }) => style(doc, '.kartu', 'borderTopLeftRadius') === '8px' },
          ],
        },
      },
      {
        title: 'Flexbox',
        slides: [
          {
            title: 'Menyusun elemen sebaris',
            body: `<p><code>display: flex</code> pada elemen induk membuat anak-anaknya tersusun sebaris:</p>
<pre>.menu {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}</pre>
<p><code>justify-content</code> mengatur posisi di sumbu utama, <code>gap</code> mengatur jarak antar-anak.</p>`,
          },
          {
            title: 'Responsif dengan flex-wrap',
            body: `<p><code>flex-wrap: wrap</code> membuat anak turun ke baris baru saat layar sempit, cocok untuk tampilan HP.</p>`,
          },
        ],
        exercise: {
          instruction: `Jadikan <code>.menu</code> sebuah flex container dengan <code>justify-content: space-between</code>, <code>gap: 8px</code>, dan <code>flex-wrap: wrap</code>.`,
          files: [
            { name: 'index.html', content: '<link rel="stylesheet" href="style.css">\n<nav class="menu">\n  <a href="#">Beranda</a>\n  <a href="#">Kursus</a>\n  <a href="#">Kontak</a>\n</nav>\n' },
            { name: 'style.css', content: '.menu {\n\n}\n' },
          ],
          hints: ['display: flex;', 'justify-content: space-between;', 'gap: 8px; dan flex-wrap: wrap;'],
          solution: { 'style.css': '.menu {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n' },
          checks: [
            { desc: 'display: flex', test: ({ doc }) => style(doc, '.menu', 'display') === 'flex' },
            { desc: 'justify-content: space-between', test: ({ doc }) => style(doc, '.menu', 'justifyContent') === 'space-between' },
            { desc: 'gap: 8px', test: ({ doc }) => style(doc, '.menu', 'columnGap') === '8px' },
            { desc: 'flex-wrap: wrap', test: ({ doc }) => style(doc, '.menu', 'flexWrap') === 'wrap' },
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
            body: `<p><code>console.log()</code> mencetak nilai ke konsol:</p>
<pre>console.log("Halo");
console.log(3 + 4); // 7</pre>
<p>Teks (string) diapit tanda kutip.</p>`,
          },
        ],
        exercise: {
          instruction: `Cetak teks <b>Halo JavaScript</b> lalu cetak hasil dari <b>12 * 3</b>.`,
          files: [{ name: 'script.js', content: '// Tulis kode di bawah ini\n\n' }],
          hints: ['console.log("Halo JavaScript");', 'console.log(12 * 3);'],
          solution: { 'script.js': 'console.log("Halo JavaScript");\nconsole.log(12 * 3);\n' },
          checks: [
            { desc: 'Mencetak "Halo JavaScript"', test: ({ logs }) => logs.includes('Halo JavaScript') },
            { desc: 'Mencetak 36', test: ({ logs }) => logs.includes('36') },
            { desc: 'Menggunakan operator *', test: ({ code }) => /12\s*\*\s*3/.test(code['script.js']) },
          ],
        },
      },
      {
        title: 'Variabel',
        slides: [
          {
            title: 'let & const',
            body: `<p>Variabel menyimpan nilai. Gunakan <code>const</code> untuk nilai tetap dan <code>let</code> untuk nilai yang bisa berubah:</p>
<pre>const nama = "Budi";
let umur = 20;
umur = umur + 1;
console.log(nama + " berumur " + umur);</pre>`,
          },
        ],
        exercise: {
          instruction: `Buat konstanta <code>nama</code> berisi namamu, lalu cetak <b>Nama saya [nama]</b> menggunakan variabel tersebut.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: ['const nama = "Ani";', 'console.log("Nama saya " + nama);'],
          solution: { 'script.js': 'const nama = "Ani";\nconsole.log("Nama saya " + nama);\n' },
          checks: [
            { desc: 'Mendeklarasikan const nama', test: ({ code }) => /const\s+nama\s*=/.test(code['script.js']) },
            { desc: 'Mencetak "Nama saya ..."', test: ({ logs }) => logs.some((l) => /^Nama saya \S/.test(l)) },
            { desc: 'console.log memakai variabel nama', test: ({ code }) => /console\.log\([^)]*\bnama\b/.test(code['script.js']) },
          ],
        },
      },
      {
        title: 'Kondisi if',
        slides: [
          {
            title: 'if / else',
            body: `<p>Gunakan <code>if</code> untuk menjalankan kode berdasarkan kondisi:</p>
<pre>const nilai = 80;
if (nilai >= 75) {
  console.log("Lulus");
} else {
  console.log("Remedial");
}</pre>`,
          },
        ],
        exercise: {
          instruction: `Variabel <code>suhu</code> sudah disediakan. Jika <code>suhu &gt; 30</code> cetak <b>Panas</b>, selain itu cetak <b>Sejuk</b>.`,
          files: [{ name: 'script.js', content: 'const suhu = 33;\n\n' }],
          hints: ['if (suhu > 30) { ... } else { ... }'],
          solution: { 'script.js': 'const suhu = 33;\n\nif (suhu > 30) {\n  console.log("Panas");\n} else {\n  console.log("Sejuk");\n}\n' },
          checks: [
            { desc: 'Menggunakan if', test: ({ code }) => /\bif\s*\(/.test(code['script.js']) },
            { desc: 'Menggunakan else', test: ({ code }) => /\belse\b/.test(code['script.js']) },
            { desc: 'Output "Panas" untuk suhu 33', test: ({ logs }) => logs.length === 1 && logs[0] === 'Panas' },
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
// 1, 2, 3</pre>`,
          },
        ],
        exercise: {
          instruction: `Gunakan <code>for</code> untuk mencetak angka <b>1 sampai 5</b>, satu per baris.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: ['for (let i = 1; i <= 5; i++) { console.log(i); }'],
          solution: { 'script.js': 'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n' },
          checks: [
            { desc: 'Menggunakan for', test: ({ code }) => /\bfor\s*\(/.test(code['script.js']) },
            { desc: 'Output 1 sampai 5 berurutan', test: ({ logs }) => logs.join(',') === '1,2,3,4,5' },
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
            body: `<p>Function adalah kumpulan langkah yang bisa dipakai berulang. <code>return</code> mengembalikan hasilnya:</p>
<pre>function tambah(a, b) {
  return a + b;
}
console.log(tambah(2, 3)); // 5</pre>`,
          },
        ],
        exercise: {
          instruction: `Buat <code>function luasPersegi(sisi)</code> yang <b>mengembalikan</b> sisi × sisi. Lalu cetak hasil <code>luasPersegi(4)</code>.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: ['function luasPersegi(sisi) { return sisi * sisi; }', 'console.log(luasPersegi(4));'],
          solution: { 'script.js': 'function luasPersegi(sisi) {\n  return sisi * sisi;\n}\n\nconsole.log(luasPersegi(4));\n' },
          checks: [
            { desc: 'Ada function luasPersegi', test: ({ win }) => typeof win.luasPersegi === 'function' },
            { desc: 'luasPersegi(5) mengembalikan 25', test: ({ win }) => win.luasPersegi(5) === 25 },
            { desc: 'Mencetak 16', test: ({ logs }) => logs.includes('16') },
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
            title: 'Menjelajah array',
            body: `<p><code>for...of</code> mengambil setiap elemen satu per satu:</p>
<pre>let total = 0;
for (const n of [1, 2, 3]) {
  total += n;
}
console.log(total); // 6</pre>`,
          },
        ],
        exercise: {
          instruction: `Hitung <b>total</b> semua isi array <code>nilai</code> dengan perulangan, lalu cetak totalnya.`,
          files: [{ name: 'script.js', content: 'const nilai = [80, 65, 90, 72];\n\n' }],
          hints: ['let total = 0;', 'for (const n of nilai) { total += n; }', 'console.log(total);'],
          solution: { 'script.js': 'const nilai = [80, 65, 90, 72];\n\nlet total = 0;\nfor (const n of nilai) {\n  total += n;\n}\nconsole.log(total);\n' },
          checks: [
            { desc: 'Menggunakan perulangan atau reduce', test: ({ code }) => /\bfor\s*\(|\.reduce\(|\.forEach\(/.test(code['script.js']) },
            { desc: 'Mencetak 307', test: ({ logs }) => logs.includes('307') },
            { desc: 'Tidak menulis 307 secara langsung', test: ({ code }) => !/307/.test(code['script.js']) },
          ],
        },
      },
      {
        title: 'Object',
        slides: [
          {
            title: 'Data dengan nama',
            body: `<p>Object menyimpan pasangan <b>kunci: nilai</b>:</p>
<pre>const siswa = {
  nama: "Rina",
  kelas: 10,
};
console.log(siswa.nama); // Rina</pre>`,
          },
        ],
        exercise: {
          instruction: `Buat object <code>buku</code> dengan properti <code>judul</code> (teks), <code>penulis</code> (teks), dan <code>tahun</code> (angka). Cetak <code>buku.judul</code>.`,
          files: [{ name: 'script.js', content: '\n' }],
          hints: ['const buku = { judul: "Laskar Pelangi", penulis: "Andrea Hirata", tahun: 2005 };', 'console.log(buku.judul);'],
          solution: { 'script.js': 'const buku = {\n  judul: "Laskar Pelangi",\n  penulis: "Andrea Hirata",\n  tahun: 2005,\n};\n\nconsole.log(buku.judul);\n' },
          checks: [
            { desc: 'Object buku punya judul dan penulis', test: ({ code }) => /buku\s*=\s*\{[\s\S]*judul\s*:[\s\S]*\}/.test(code['script.js']) && /penulis\s*:/.test(code['script.js']) },
            { desc: 'tahun berupa angka', test: ({ code }) => /tahun\s*:\s*\d+/.test(code['script.js']) },
            { desc: 'Mencetak buku.judul', test: ({ code, logs }) => /console\.log\(\s*buku\.judul\s*\)/.test(code['script.js']) && logs.length > 0 && logs[0] !== 'undefined' },
          ],
        },
      },
      {
        title: 'DOM & Event',
        slides: [
          {
            title: 'Mengambil elemen',
            body: `<p>JavaScript bisa mengubah halaman lewat DOM:</p>
<pre>const judul = document.getElementById("judul");
judul.textContent = "Teks baru";</pre>`,
          },
          {
            title: 'Bereaksi pada klik',
            body: `<p><code>addEventListener</code> menjalankan function saat event terjadi:</p>
<pre>tombol.addEventListener("click", function () {
  console.log("diklik");
});</pre>`,
          },
        ],
        exercise: {
          instruction: `Saat tombol <code>#tombol</code> diklik, ubah teks <code>#hasil</code> menjadi <b>Diklik!</b>. Coba klik tombolnya di tab Hasil.`,
          files: [
            { name: 'index.html', content: '<button id="tombol">Klik saya</button>\n<p id="hasil">Belum diklik</p>\n<script src="script.js"></script>\n' },
            { name: 'script.js', content: 'const tombol = document.getElementById("tombol");\nconst hasil = document.getElementById("hasil");\n\n' },
          ],
          hints: ['tombol.addEventListener("click", function () { ... });', 'hasil.textContent = "Diklik!";'],
          solution: { 'script.js': 'const tombol = document.getElementById("tombol");\nconst hasil = document.getElementById("hasil");\n\ntombol.addEventListener("click", function () {\n  hasil.textContent = "Diklik!";\n});\n' },
          checks: [
            { desc: 'Menggunakan addEventListener("click", ...)', test: ({ code }) => /addEventListener\(\s*["']click["']/.test(code['script.js']) },
            { desc: 'Teks awal tidak berubah sebelum diklik', test: ({ doc }) => text(doc, '#hasil') === 'Belum diklik' },
            { desc: 'Setelah diklik, #hasil berisi "Diklik!"', test: ({ doc }) => { $(doc, '#tombol').click(); return text(doc, '#hasil') === 'Diklik!'; } },
          ],
        },
      },
    ],
  },
];
