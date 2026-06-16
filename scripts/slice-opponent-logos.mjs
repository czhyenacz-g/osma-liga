import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "banners.png");
const OUT = join(ROOT, "public", "banners");

const LOGOS = [
  "tj_sokol_tupoljany",
  "sk_dolni_lhota",
  "fk_parezov",
  "tj_jiskra_vetrovy",
  "sokol_mokra_stran",
  "sk_nove_drny",
  "fk_zelena_mezna",
  "tj_slavoj_brodek",
  "fc_kamenice",
  "tj_dynamo_loucany",
];

const COLS = 5;
const ROWS = 2;
const ALPHA_THRESHOLD = 5;
const GAP_MIN = 8;       // min. průhledných pixelů = mezera mezi logy
const PADDING = 4;       // px přidaný okolo detekovaného bboxu

if (!existsSync(SRC)) {
  console.error(`❌  Zdrojový soubor nenalezen: ${SRC}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const alpha = (x, y) => data[(y * width + x) * channels + (channels - 1)];

// Skenuj jednu linii a vrať skupiny s obsahem
function detectRanges(scanFn, size) {
  const ranges = [];
  let start = null, last = null;
  for (let i = 0; i <= size; i++) {
    const active = i < size && scanFn(i) > ALPHA_THRESHOLD;
    if (active && start === null) start = i;
    if (active) last = i;
    if (!active && start !== null && i - last > GAP_MIN) {
      ranges.push({ start, end: last });
      start = null;
    }
  }
  return ranges;
}

// Y-rozsahy: skenuj prostřední sloupec
const yRanges = detectRanges(y => {
  let max = 0;
  for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x += 5)
    max = Math.max(max, alpha(x, y));
  return max;
}, height);

// X-rozsahy: skenuj z každé řady
const xRanges = yRanges.map(yr => {
  const midY = Math.round((yr.start + yr.end) / 2);
  return detectRanges(x => alpha(x, midY), width);
});

console.log(`📐  Zdrojový obrázek: ${width}×${height}px`);
console.log(`🔍  Detekované řady (Y):`, yRanges.map(r => `${r.start}–${r.end}`).join(", "));
xRanges.forEach((row, ri) =>
  console.log(`🔍  Řada ${ri + 1} sloupce (X):`, row.map(r => `${r.start}–${r.end}`).join(", "))
);

if (yRanges.length !== ROWS) {
  console.error(`❌  Očekáváno ${ROWS} řad, nalezeno ${yRanges.length}`);
  process.exit(1);
}

let idx = 0;
console.log();

for (let row = 0; row < ROWS; row++) {
  const yr = yRanges[row];
  const cols = xRanges[row];

  if (cols.length !== COLS) {
    console.warn(`⚠️   Řada ${row + 1}: očekáváno ${COLS} sloupců, nalezeno ${cols.length}`);
  }

  for (let col = 0; col < Math.min(cols.length, COLS); col++) {
    const xr = cols[col];
    const left   = Math.max(0, xr.start - PADDING);
    const top    = Math.max(0, yr.start  - PADDING);
    const right  = Math.min(width - 1,  xr.end  + PADDING);
    const bottom = Math.min(height - 1, yr.end   + PADDING);

    const outFile = join(OUT, `${LOGOS[idx]}.webp`);
    await sharp(SRC)
      .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
      .webp({ quality: 90 })
      .toFile(outFile);

    console.log(`✅  [${idx + 1}/10] ${LOGOS[idx]}.webp  (${right - left + 1}×${bottom - top + 1}px)`);
    idx++;
  }
}

console.log(`\n🎉  Hotovo — soubory uloženy do public/banners/`);
