const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, 'public/images/favicon.png');
const outputDir = path.join(__dirname, 'public');

const sizes = [
    // Standard unversioned icons (highly stable for Google Search crawlers)
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'maskable-icon-192x192.png', size: 192 },
    { name: 'maskable-icon-512x512.png', size: 512 },
    // Versioned -v2 icons (for explicit browser cache-busting)
    { name: 'favicon-16x16-v2.png', size: 16 },
    { name: 'favicon-32x32-v2.png', size: 32 },
    { name: 'apple-touch-icon-v2.png', size: 180 },
    { name: 'icon-192x192-v2.png', size: 192 },
    { name: 'icon-512x512-v2.png', size: 512 },
    { name: 'maskable-icon-192x192-v2.png', size: 192 },
    { name: 'maskable-icon-512x512-v2.png', size: 512 }
];

async function generateIcons() {
    try {
        console.log('Generating resized icons...');
        for (const { name, size } of sizes) {
            await sharp(inputImagePath)
                .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
                .toFile(path.join(outputDir, name));
            console.log(`Generated ${name} (${size}x${size})`);
        }
        
        // Generate both favicon.ico and favicon-v2.ico from 32x32 png
        fs.copyFileSync(path.join(outputDir, 'favicon-32x32.png'), path.join(outputDir, 'favicon.ico'));
        fs.copyFileSync(path.join(outputDir, 'favicon-32x32-v2.png'), path.join(outputDir, 'favicon-v2.ico'));
        console.log('Copied 32x32 png files to favicon.ico and favicon-v2.ico');
        console.log('All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
