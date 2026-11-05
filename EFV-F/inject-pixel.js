/**
 * inject-pixel.js
 * Injects the Meta Pixel tracking snippet into all HTML files
 * in the public/ directory (index.html + all pages/*.html).
 *
 * Pixel ID: 1015594134713138
 * Run with: node inject-pixel.js
 */

const fs = require('fs');
const path = require('path');

const PIXEL_ID = '1015594134713138';

const PIXEL_SNIPPET = `
    <!-- Meta Pixel Code -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${PIXEL_ID}');
    fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->`;

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

  if (content.includes(PIXEL_ID)) {
    console.log(`[SKIP]    Already has Meta Pixel: ${path.relative(__dirname, filePath)}`);
    skipped++;
    continue;
  }

  // Inject just before </head>
  if (content.includes('</head>')) {
    content = content.replace('</head>', `${PIXEL_SNIPPET}\n</head>`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[INJECTED] ${path.relative(__dirname, filePath)}`);
    injected++;
  } else {
    console.log(`[WARN]    No </head> tag found: ${path.relative(__dirname, filePath)}`);
  }
}

console.log(`\nDone. ${injected} file(s) updated, ${skipped} file(s) already had Meta Pixel.`);
