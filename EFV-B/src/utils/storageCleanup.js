const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const hasGCS = process.env.GCS_BUCKET_NAME && process.env.GCS_BUCKET_NAME !== 'efv-assets-bucket';
let storage;

if (hasGCS) {
    storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID || 'efvframework'
    });
}

/**
 * Safely delete a file from GCS or local disk
 * @param {string} filePath - Absolute URL, GCS proxy URL, relative path, or direct storage URL
 */
const deleteFile = async (filePath) => {
    if (!filePath) return;
    try {
        if (hasGCS && storage) {
            // 1. If it's a proxy path, e.g. /api/images/cover/covers/cover-123.jpg
            if (filePath.startsWith('/api/images/') || filePath.includes('/api/images/')) {
                let bucketName = process.env.GCS_BUCKET_NAME;
                let gcsFileName = '';

                if (filePath.includes('/api/images/cover/')) {
                    gcsFileName = filePath.split('/api/images/cover/')[1];
                    if (process.env.GCS_COVER_BUCKET_NAME) {
                        bucketName = process.env.GCS_COVER_BUCKET_NAME;
                    }
                } else if (filePath.includes('/api/images/gallery/')) {
                    gcsFileName = filePath.split('/api/images/gallery/')[1];
                    if (process.env.GCS_COVER_BUCKET_NAME) {
                        bucketName = process.env.GCS_COVER_BUCKET_NAME;
                    }
                } else {
                    gcsFileName = filePath.split('/api/images/')[1];
                }

                if (gcsFileName) {
                    await storage.bucket(bucketName).file(gcsFileName).delete()
                        .then(() => console.log(`☁️ Deleted GCS proxy file: ${gcsFileName} from bucket ${bucketName}`))
                        .catch(e => console.warn(`GCS delete proxy warn: ${e.message}`));
                    return;
                }
            }

            // 2. If it's a direct GCS storage link, e.g. https://storage.googleapis.com/...
            if (filePath.startsWith('http') || filePath.includes('storage.googleapis.com')) {
                let bucketName = process.env.GCS_BUCKET_NAME;
                let gcsFileName = '';

                const isCoverOrGallery = filePath.includes('/covers/') || filePath.includes('/gallery/');
                if (isCoverOrGallery && process.env.GCS_COVER_BUCKET_NAME) {
                    bucketName = process.env.GCS_COVER_BUCKET_NAME;
                }

                const parts = filePath.split(`${bucketName}/`);
                if (parts.length > 1) {
                    gcsFileName = parts[1];
                } else {
                    const urlParts = filePath.split('/');
                    gcsFileName = urlParts.slice(4).join('/');
                }

                if (gcsFileName) {
                    await storage.bucket(bucketName).file(gcsFileName).delete()
                        .then(() => console.log(`☁️ Deleted GCS direct file: ${gcsFileName} from bucket ${bucketName}`))
                        .catch(e => console.warn(`GCS delete direct warn: ${e.message}`));
                    return;
                }
            }
        }

        // 3. Fallback: Local file deletion
        const cleanPath = filePath.replace(/^https?:\/\/[^/]+\/[^/]+\//, '').replace(/^\//, '');
        const searchPaths = [
            path.resolve(__dirname, '../../', cleanPath),
            path.resolve(__dirname, '../../src/uploads/', cleanPath.replace(/^src\/uploads\//, '').replace(/^uploads\//, '')),
            path.resolve(__dirname, '../../uploads/', cleanPath.replace(/^src\/uploads\//, '').replace(/^uploads\//, '')),
            path.join(process.cwd(), cleanPath),
            path.join(process.cwd(), 'src', cleanPath),
            path.join(process.cwd(), 'src/uploads', cleanPath.replace(/^uploads\//, ''))
        ];

        for (const p of searchPaths) {
            if (fs.existsSync(p) && !fs.lstatSync(p).isDirectory()) {
                fs.unlinkSync(p);
                console.log(`🗑️ Deleted local file: ${p}`);
                return;
            }
        }
        console.log(`ℹ️ File not found locally or skipped: ${filePath}`);
    } catch (err) {
        console.error(`❌ Failed to delete storage file "${filePath}":`, err.message);
    }
};

module.exports = { deleteFile };
