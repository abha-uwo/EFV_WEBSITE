const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'products.json');
let products = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const mapping = {
  "efv_v1_ebook": "https://storage.googleapis.com/efvbucket/ebooks/ebook-1782474603863-671210691-efv_canon_volume_1___the_origin_code__final.pdf",
  "efv_v1_ebook_en": "https://storage.googleapis.com/efvbucket/ebooks/ebook-1774426973305-913792569-efv_canon_volume_1___the_origin_code____final__28.02.26__colour.pdf",
  "efv_v2_ebook": "https://storage.googleapis.com/efvbucket/ebooks/ebook-1782474627526-305733205-classic_mindos_hindi_updated__3_.pdf",
  "efv_v2_ebook_en": "https://storage.googleapis.com/efvbucket/ebooks/ebook-1782113213058-419167394-efv_vol_2_final_cover_english_book.pdf"
};

let updated = 0;
products = products.map(p => {
  if (mapping[p._id]) {
    p.filePath = mapping[p._id];
    updated++;
  }
  return p;
});

fs.writeFileSync(dbPath, JSON.stringify(products, null, 2));
console.log(`Updated ${updated} products with file paths!`);
