import sharp from "sharp";
import { existsSync } from "fs";

const SRC = "public/top_background.png";
const OUT = "public/top_background.webp";

if (!existsSync(SRC)) {
  console.error(`❌  Zdrojový soubor nenalezen: ${SRC}`);
  process.exit(1);
}

const { width, height } = await sharp(SRC).metadata();
await sharp(SRC).webp({ quality: 85 }).toFile(OUT);

const { size } = await import("fs").then(fs => fs.promises.stat(OUT));
console.log(`✅  ${OUT}  (${width}×${height}px, ${(size / 1024).toFixed(0)} KB)`);
