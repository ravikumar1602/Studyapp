const fs = require('fs');
const path = require('path');

// PWA tags to add
const pwaTags = `
    <meta name="theme-color" content="#4a6cf7">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
`;

// Directory containing HTML files
const htmlDir = __dirname;

// Get all HTML files in the directory
const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

// Process each HTML file
htmlFiles.forEach(file => {
    const filePath = path.join(htmlDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if manifest is already present
    if (content.includes('manifest')) {
        console.log(`Skipping ${file} - already has manifest`);
        return;
    }
    
    // Insert PWA tags after the viewport meta tag
    content = content.replace(
        /(<meta[^>]*name=["']viewport["'][^>]*>)/i,
        `$1${pwaTags}`
    );
    
    // Save the updated file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} with PWA tags`);
});

console.log('PWA tags added to all HTML files');
