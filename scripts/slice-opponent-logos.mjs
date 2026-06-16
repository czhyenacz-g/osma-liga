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

if (!existsSync(SRC)) {
  console.error(`❌  Zdrojový soubor nenalezen: ${SRC}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
const { width, height } = meta;

const cellW = Math.floor(width / COLS);
const cellH = Math.floor(height / ROWS);

console.log(`📐  Zdrojový obrázek: ${width}×${height}px`);
console.log(`📦  Buňka mřížky:    ${cellW}×${cellH}px\n`);

for (let i = 0; i < LOGOS.length; i++) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);

  const outFile = join(OUT, `${LOGOS[i]}.webp`);

  await sharp(SRC)
    .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
    .trim({ background: "#ffffff", threshold: 20 })
    .webp({ quality: 90 })
    .toFile(outFile);

  console.log(`✅  [${i + 1}/10] ${LOGOS[i]}.webp`);
}

console.log(`\n🎉  Hotovo — soubory uloženy do public/banners/`);
