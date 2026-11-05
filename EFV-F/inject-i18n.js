const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'public', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove any existing i18n script tags (like at the bottom of admin/profile)
    content = content.replace(/<script src="\.\.\/js\/i18n\.js"><\/script>\n?/g, '');

    // 2. Inject it before </head> if not already there
    if (!content.includes('<!-- Global I18n System')) {
        content = content.replace('</head>', '    <!-- Global I18n System (Loaded early to prevent FOUT) -->\n    <script src="../js/i18n.js"></script>\n</head>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Injected into ${file}`);
    } else {
        console.log(`Already injected into ${file}`);
        // ensure any bottom scripts were removed
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
console.log('Done.');
