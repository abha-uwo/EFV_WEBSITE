/**
 * inject-clarity.js
 * Injects the Microsoft Clarity snippet into all HTML files
 * in the public/ directory (index.html + all pages/*.html).
 *
 * Clarity Project ID: xna8nwpoq6
 * Run with: node inject-clarity.js
 */

const fs = require('fs');
const path = require('path');

const CLARITY_PROJECT_ID = 'xna8nwpoq6';

const CLARITY_SNIPPET = `
    <!-- Microsoft Clarity Tracking Code -->
    <script type="text/javascript">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
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

  if (content.includes(CLARITY_PROJECT_ID)) {
    console.log(`[SKIP]    Already has Clarity: ${path.relative(__dirname, filePath)}`);
    skipped++;
    continue;
  }

  // Inject just before </head>
  if (content.includes('</head>')) {
    content = content.replace('</head>', `${CLARITY_SNIPPET}\n</head>`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[INJECTED] ${path.relative(__dirname, filePath)}`);
    injected++;
  } else {
    console.log(`[WARN]    No </head> tag found: ${path.relative(__dirname, filePath)}`);
  }
}

console.log(`\nDone. ${injected} file(s) updated, ${skipped} file(s) already had Clarity.`);
