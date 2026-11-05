const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if nav-links exists
            const navRegex = /<ul class="nav-links">([\s\S]*?)<\/ul>/;
            const match = content.match(navRegex);
            
            if (match) {
                let navContent = match[1];
                
                // If Offers is already there, skip
                if (!navContent.includes('nav.offers') && !navContent.includes('Offers</a>')) {
                    // Decide path to offers based on depth/directory
                    const isRoot = fullPath.endsWith('index.html') || path.dirname(fullPath) === path.join(__dirname, 'public');
                    const offersHref = isRoot ? 'pages/offers.html' : 'offers.html';
                    
                    // We want to insert beside Marketplace
                    const marketplaceRegex = /(<li.*?href="[^"]*?marketplace\.html"[^>]*>Marketplace<\/a><\/li>)/i;
                    
                    if (marketplaceRegex.test(navContent)) {
                        const replacement = `$1\n                <li><a href="${offersHref}" data-i18n="nav.offers">Offers</a></li>`;
                        navContent = navContent.replace(marketplaceRegex, replacement);
                        
                        content = content.replace(navRegex, `<ul class="nav-links">${navContent}</ul>`);
                        
                        // For offers.html itself, ensure Offers is marked active
                        if (fullPath.endsWith('offers.html')) {
                            // Add active gold-text class to Offers and remove from others if any
                            content = content.replace(
                                `href="${offersHref}" data-i18n="nav.offers"`,
                                `href="${offersHref}" class="active gold-text" data-i18n="nav.offers"`
                            );
                            // Ensure Marketplace does not have active class
                            content = content.replace(
                                /class="active gold-text" data-i18n="nav.marketplace"/,
                                'data-i18n="nav.marketplace"'
                            );
                        }
                        
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log('Added Offers nav item to', fullPath);
                    }
                }
            }
        }
    }
}

processDir(path.join(__dirname, 'public'));
console.log('Navigation links update completed.');
