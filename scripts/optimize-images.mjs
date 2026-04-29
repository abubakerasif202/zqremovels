/**
 * scripts/optimize-images.mjs
 *
 * Re-compresses WebP images in /media/ to reduce file size and
 * generates responsive variants (480w, 960w) in /media/responsive/.
 *
 * Run once: node scripts/optimize-images.mjs
 * The output is committed to the repo; the build then uses the
 * pre-generated files so build time stays fast.
 */

import sharp from 'sharp';
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const mediaDir = path.join(projectRoot, 'media');
const responsiveDir = path.join(mediaDir, 'responsive');

// Responsive widths to generate for hero images.
const RESPONSIVE_WIDTHS = [480, 960];

// Max width for the main (full-size) image in dist.
// Gemini images are 1600px wide but rendered at 960px; cap at 1200px.
const MAX_DISPLAY_WIDTH = 1200;

// Quality setting for re-compression.
const WEBP_QUALITY = 72;

// Social share image is used by Open Graph; keep at reasonable quality.
const SOCIAL_SHARE_QUALITY = 80;

async function getFiles(dir, ext) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(ext))
    .map((e) => e.name);
}

async function recompressWebp(srcPath, destPath, opts = {}) {
  const { maxWidth = MAX_DISPLAY_WIDTH, quality = WEBP_QUALITY } = opts;
  const meta = await sharp(srcPath).metadata();
  const pipeline = sharp(srcPath);

  if (meta.width > maxWidth) {
    pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  await pipeline.webp({ quality }).toFile(destPath);
}

async function generateResponsiveVariant(srcPath, outDir, baseName, width) {
  const outName = `${baseName}-${width}w.webp`;
  const outPath = path.join(outDir, outName);
  await sharp(srcPath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outPath);
  return outName;
}

async function fileSizeKb(p) {
  try {
    const s = await stat(p);
    return (s.size / 1024).toFixed(1);
  } catch {
    return '?';
  }
}

async function main() {
  await mkdir(responsiveDir, { recursive: true });

  const webpFiles = await getFiles(mediaDir, '.webp');

  for (const file of webpFiles) {
    const srcPath = path.join(mediaDir, file);
    const baseName = file.replace(/\.webp$/, '');
    const isSocialShare = file.includes('social-share');
    const quality = isSocialShare ? SOCIAL_SHARE_QUALITY : WEBP_QUALITY;

    const sizeBefore = await fileSizeKb(srcPath);

    // Re-compress in-place via a temp buffer then write.
    const meta = await sharp(srcPath).metadata();
    const maxWidth = isSocialShare ? 1536 : MAX_DISPLAY_WIDTH;
    const pipeline = sharp(srcPath);
    if (meta.width > maxWidth) {
      pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }
    const buf = await pipeline.webp({ quality }).toBuffer();
    await writeFile(srcPath, buf);

    const sizeAfter = await fileSizeKb(srcPath);
    console.log(`✔  ${file.padEnd(52)} ${sizeBefore}KB → ${sizeAfter}KB`);

    // Generate responsive variants.
    for (const width of RESPONSIVE_WIDTHS) {
      if (meta.width >= width) {
        const name = await generateResponsiveVariant(srcPath, responsiveDir, baseName, width);
        const sz = await fileSizeKb(path.join(responsiveDir, name));
        console.log(`   └─ ${name.padEnd(54)} ${sz}KB`);
      }
    }
  }

  console.log('\n✅  Image optimization complete.');
  console.log(`   Re-compressed: ${webpFiles.length} WebP files`);
  console.log(`   Responsive variants in: media/responsive/`);
}

main().catch((err) => {
  console.error('❌  Optimization failed:', err);
  process.exit(1);
});
