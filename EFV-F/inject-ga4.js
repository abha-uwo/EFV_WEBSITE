/**
 * inject-ga4.js
 * Injects the GA4 (Google Analytics 4) snippet via gtag.js into all HTML files
 * in the public/ directory (index.html + all pages/*.html).
 *
 * Measurement ID: G-D2Z48EXJ9Z
 * Run with: node inject-ga4.js
 */

const fs = require('fs');
const path = require('path');

const GA4_MEASUREMENT_ID = 'G-D2Z48EXJ9Z';

const GA4_SNIPPET = `
    <!-- Google tag (gtag.js) - GA4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA4_MEASUREMENT_ID}');
    </script>`;

const HTML_FILES = [
  path.join(__dirname, 'public', 'index.html'),
  ...fs.readdirSync(path.join(__dirname, 'public', 'pages'))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(__dirname, 'public', 'pages', f)),
];

let injected = 0;
let skipped = 0;

for (const filePath of HTML_FILES) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(GA4_MEASUREMENT_ID)) {
    console.log(`[SKIP]    Already has GA4: ${path.relative(__dirname, filePath)}`);
    skipped++;
    continue;
  }

  // Inject just before </head>
  if (content.includes('</head>')) {
    content = content.replace('</head>', `${GA4_SNIPPET}\n</head>`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[INJECTED] ${path.relative(__dirname, filePath)}`);
    injected++;
  } else {
    console.log(`[WARN]    No </head> tag found: ${path.relative(__dirname, filePath)}`);
  }
}

console.log(`\nDone. ${injected} file(s) updated, ${skipped} file(s) already had GA4.`);
