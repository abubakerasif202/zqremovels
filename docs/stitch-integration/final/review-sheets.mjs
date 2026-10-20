import sharp from 'sharp';
const output = 'docs/stitch-integration/final';
const names = ['home', 'glenelg', 'norwood', 'adelaide', 'interstate', 'sydney', 'perth', 'brisbane'];
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
for (const name of names) {
  const file = `${output}/${name}-390.jpg`;
  const metadata = await sharp(file).metadata();
  const panels = Math.ceil(metadata.height / 1600);
  const composites = [];
  for (let index = 0; index < panels; index++) {
    const top = index * 1600;
    const height = Math.min(1600, metadata.height - top);
    const input = await sharp(file).extract({ left: 0, top, width: 390, height }).resize({ width: 195 }).toBuffer();
    composites.push({ input, left: index % 8 * 205, top: Math.floor(index / 8) * 820 });
  }
  await sharp({ create: { width: 1640, height: Math.ceil(panels / 8) * 820, channels: 3, background: '#ddd' } })
    .composite(composites).jpeg({ quality: 85 }).toFile(`${output}/${name}-390-review.jpg`);
  const viewportComposites = [];
  for (let index = 0; index < widths.length; index++) {
    const width = widths[index];
    const input = await sharp(`${output}/${name}-${width}.jpg`)
      .extract({ left: 0, top: 0, width, height: 900 }).resize({ width: 200, height: 560, fit: 'inside' }).toBuffer();
    const label = Buffer.from(`<svg width="210" height="30"><text x="4" y="18" font-size="14">${width}px</text></svg>`);
    viewportComposites.push({ input: label, left: index * 210, top: 0 }, { input, left: index * 210, top: 30 });
  }
  await sharp({ create: { width: 2100, height: 600, channels: 3, background: '#ddd' } })
    .composite(viewportComposites).jpeg({ quality: 85 }).toFile(`${output}/${name}-width-review.jpg`);
}
