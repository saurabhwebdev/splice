const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Define the sizes we want to generate
const sizes = [
  16,    // favicon-16x16.png
  32,    // favicon-32x32.png
  48,    // Windows tiles
  72,    // Android/iOS
  96,    // Android/iOS
  128,   // Android/iOS
  144,   // Android/iOS (specifically for PWA)
  152,   // iOS
  192,   // Android
  384,   // Android
  512    // Android
];

async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = await fs.readFile(path.join(__dirname, '../public/logo.svg'));
    
    // Create the public directory if it doesn't exist
    const publicDir = path.join(__dirname, '../public');
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir);
    }

    // Generate icons for each size
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }

    // Generate specific icons for different platforms
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('Generated favicon.ico');

    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 