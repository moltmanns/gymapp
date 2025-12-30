import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');
const sourceIcon = join(publicDir, 'gymapp-icon.png');

const sizes = [
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating PWA icons from gymapp-icon.png...\n');

  // Ensure icons directory exists
  await mkdir(iconsDir, { recursive: true });

  for (const { name, size } of sizes) {
    const outputPath = join(iconsDir, name);
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 12, g: 12, b: 14, alpha: 1 } // #0c0c0e
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icons/${name} (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
