const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir);

const htmlFiles = files.filter(f => f.endsWith('.html'));

let modifiedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Automatically increment any ?v=X.X found in the HTML files
    content = content.replace(/\?v=(\d+\.\d+)/g, (match, p1) => {
        let newVersion = (parseFloat(p1) + 0.1).toFixed(1);
        return `?v=${newVersion}`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
});

console.log(`Updated JS and CSS cache versions in ${modifiedCount} HTML files.`);

// Also update SW to auto-increment ktw-v{number}
const swPath = path.join(publicDir, 'sw.js');
if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    swContent = swContent.replace(/ktw-v(\d+)/g, (match, p1) => {
        let newVersion = parseInt(p1) + 1;
        return `ktw-v${newVersion}`;
    });
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log("Updated sw.js cache name to next version");
}
