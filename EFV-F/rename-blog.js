const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const pagesDir = path.join(publicDir, 'pages');
const jsDir = path.join(publicDir, 'js');

// 1. Rename files
function renameIfExists(oldPath, newPath) {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${path.basename(oldPath)} -> ${path.basename(newPath)}`);
    }
}

renameIfExists(path.join(pagesDir, 'insights.html'), path.join(pagesDir, 'blogs.html'));
renameIfExists(path.join(pagesDir, 'insight-detail.html'), path.join(pagesDir, 'blog-detail.html'));
renameIfExists(path.join(jsDir, 'insights.js'), path.join(jsDir, 'blogs.js'));
renameIfExists(path.join(jsDir, 'admin-insights.js'), path.join(jsDir, 'admin-blogs.js'));

// 2. Replace text in files
function replaceInFiles(dir, extensions, replacements) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath, extensions, replacements);
        } else if (extensions.some(ext => fullPath.endsWith(ext))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const [regex, replacement] of replacements) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated text in: ${path.basename(fullPath)}`);
            }
        }
    }
}

// Replacements for HTML files
const htmlReplacements = [
    [/insights\.html/g, 'blogs.html'],
    [/insight-detail\.html/g, 'blog-detail.html'],
    [/>Insights<\/a>/g, '>Blogs</a>'], // Top nav
    [/EFV™ INSIGHTS/g, 'EFV™ BLOGS'],
    [/Search insights/g, 'Search blogs'],
    [/All Insights/g, 'All Blogs'],
    [/No insights found/g, 'No blogs found'],
    [/insights\.js/g, 'blogs.js'],
    [/admin-insights\.js/g, 'admin-blogs.js'],
    [/Insights Management/g, 'Blogs Management'],
    [/CREATE NEW INSIGHT/g, 'CREATE NEW BLOG'],
    [/EDIT INSIGHT/g, 'EDIT BLOG'],
    [/Insight Title/g, 'Blog Title'],
    [/DELETE INSIGHT/g, 'DELETE BLOG'],
    [/PUBLISH INSIGHT/g, 'PUBLISH BLOG'],
    [/UPDATE INSIGHT/g, 'UPDATE BLOG'],
    [/Total Insights/g, 'Total Blogs'],
    [/Published Insights/g, 'Published Blogs'],
    [/Latest Insights/g, 'Latest Blogs']
];

replaceInFiles(publicDir, ['.html'], htmlReplacements);

// Replacements for JS files
const jsReplacements = [
    [/insight-detail\.html/g, 'blog-detail.html'],
    [/No insights published yet/g, 'No blogs published yet'],
    [/Insight saved/g, 'Blog saved'],
    [/delete this insight/g, 'delete this blog'],
    [/delete insight/g, 'delete blog'],
    [/CREATE NEW INSIGHT/g, 'CREATE NEW BLOG'],
    [/EDIT INSIGHT/g, 'EDIT BLOG'],
    [/PUBLISH INSIGHT/g, 'PUBLISH BLOG'],
    [/UPDATE INSIGHT/g, 'UPDATE BLOG']
];

replaceInFiles(jsDir, ['.js'], jsReplacements);

console.log('All replacements done.');
