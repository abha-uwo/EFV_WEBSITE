const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config({ path: './.env' });

async function fixAudiobooks() {
    const storage = new Storage({ projectId: process.env.GCS_PROJECT_ID });
    const bucketName = process.env.GCS_BUCKET_NAME;
    const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'audios/' });

    // Filter files for vol_1 Hindi
    let vol1Files = files.filter(f => f.name.includes('vol_1') && !f.name.includes('english'));
    
    let chaptersMap = new Map();
    
    vol1Files.forEach(file => {
        const match = file.name.match(/chapter_(\d+)/);
        if (match) {
            const chapNum = parseInt(match[1]);
            // If duplicate, keep latest (or just first we see)
            if (!chaptersMap.has(chapNum)) {
                chaptersMap.set(chapNum, file.name);
            } else {
                // simple deduplication based on creation time if possible, or just ignore
            }
        }
    });

    let chaptersArray = [];
    for (let i = 1; i <= 22; i++) {
        if (chaptersMap.has(i)) {
            chaptersArray.push({
                chapterNumber: i,
                title: `Chapter ${i}`,
                filePath: `https://storage.googleapis.com/${bucketName}/${chaptersMap.get(i)}`,
                duration: "0:00"
            });
        }
    }

    const dbPath = path.join(__dirname, 'src', 'data', 'products.json');
    let products = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    let updated = 0;
    products = products.map(p => {
        if (p._id === 'efv_v1_audiobook') {
            p.chapters = chaptersArray;
            p.totalChapters = chaptersArray.length;
            updated++;
        }
        return p;
    });

    fs.writeFileSync(dbPath, JSON.stringify(products, null, 2));
    console.log(`Updated ${updated} audiobook with ${chaptersArray.length} chapters!`);
}

fixAudiobooks().catch(console.error);
