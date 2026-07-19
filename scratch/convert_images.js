import sharp from 'sharp';
import path from 'path';

const srcDir = 'C:\\Users\\abuba\\.gemini\\antigravity-cli\\brain\\afbddea9-1009-482e-84e0-d0dfd73caf5b';
const destDir = 'C:\\Users\\abuba\\zq\\public\\images\\zq-apartment-ad';

const mapping = [
  { src: 'ad_scene_1_1783812764463.jpg', dest: 'scene-1.webp' },
  { src: 'ad_scene_2_1783812858736.jpg', dest: 'scene-2.webp' },
  { src: 'ad_scene_3_1783812957713.jpg', dest: 'scene-3.webp' },
  { src: 'ad_scene_4_1783813066057.jpg', dest: 'scene-4.webp' }
];

async function convert() {
  for (const item of mapping) {
    const srcPath = path.join(srcDir, item.src);
    const destPath = path.join(destDir, item.dest);
    console.log(`Converting ${srcPath} -> ${destPath}...`);
    await sharp(srcPath)
      .resize(720, 1280) // Match 9:16 target size
      .webp({ quality: 82 })
      .toFile(destPath);
    console.log(`Saved ${destPath}`);
  }
}

convert().then(() => console.log('All images converted.')).catch(console.error);
