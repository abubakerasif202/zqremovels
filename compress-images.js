const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = "./media";   // change if needed
const OUTPUT_DIR = "./site-src/assets-optimized";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(INPUT_DIR);

(async () => {
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(
      OUTPUT_DIR,
      file.replace(/\.(jpg|jpeg|png)$/i, ".webp")
    );

    if (!fs.statSync(inputPath).isFile()) continue;

    try {
      await sharp(inputPath)
        .resize({ width: 1600 }) // max width
        .webp({ quality: 70 })
        .toFile(outputPath);

      console.log(`✅ Optimized: ${file}`);
    } catch (err) {
      console.log(`❌ Skipped: ${file}`);
    }
  }

  console.log("\n🔥 ALL IMAGES OPTIMIZED");
})();