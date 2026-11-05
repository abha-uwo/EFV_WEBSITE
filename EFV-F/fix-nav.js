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
            let isIndex = fullPath.endsWith('index.html');
            
            // Extract the nav-links block
            const navRegex = /<ul class="nav-links">([\s\S]*?)<\/ul>/;
            const match = content.match(navRegex);
            
            if (match) {
                let navContent = match[1];
                // Check if Insights is already in this nav-links block
                if (!navContent.includes('Insights</a>')) {
                    // Find Marketplace line
                    const marketplaceRegex = /(<li.*?<a href="[^"]*?marketplace\.html"[^>]*>Marketplace<\/a><\/li>)/i;
                    
                    if (marketplaceRegex.test(navContent)) {
                        const href = isIndex ? 'pages/insights.html' : 'insights.html';
                        
                        // For insights.html and insight-detail.html, we should also make it active.
                        // Let's just add the link first.
                        const activeClass = (fullPath.endsWith('insights.html') || fullPath.endsWith('insight-detail.html')) ? ' class="active gold-text"' : '';
                        
                        const replacement = `$1\n                <li><a href="${href}"${activeClass}>Insights</a></li>`;
                        navContent = navContent.replace(marketplaceRegex, replacement);
                        
                        content = content.replace(navRegex, `<ul class="nav-links">${navContent}</ul>`);
                        
                        // Wait, if it's insights.html, we should also remove the active class from Marketplace
                        if (fullPath.endsWith('insights.html') || fullPath.endsWith('insight-detail.html')) {
                            // Find the marketplace line and remove class="active gold-text"
                            // Wait, it's easier to just do it via regex on the new content
                            const marketplaceActiveRegex = /<a href="([^"]*?marketplace\.html)" class="active gold-text">Marketplace<\/a>/i;
                            content = content.replace(marketplaceActiveRegex, `<a href="$1">Marketplace</a>`);
                        }
                        
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log('Fixed Nav in', fullPath);
                    }
                }
            }
        }
    }
}

processDir(path.join(__dirname, 'public'));
console.log('Done');
